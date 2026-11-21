/**
 * Keep one rolling event pull request.
 *
 * Each run resets bot/events-inbox onto origin/main and adds listings that
 * are not already on main or in the inbox. The branch only gains files in
 * src/content/events/ and public/images/events/. When nothing qualifies,
 * no pull request is opened.
 */
import { spawn } from 'node:child_process';
import { accessSync, constants } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  EVENT_MD,
  EVENT_POSTER,
  decidePublish,
  isInboxPath,
  parseListing,
  planInboxChanges,
} from './event-match.mjs';

export const inboxBranch = 'bot/events-inbox';
const inboxTitle = 'Upcoming events';

function findExecutable(name) {
  const found = new Set();
  const candidates = [
    ...(process.env.PATH || '').split(path.delimiter).filter(Boolean).map((dir) => path.join(dir, name)),
    `/opt/homebrew/bin/${name}`,
    `/usr/local/bin/${name}`,
    `/usr/bin/${name}`,
  ];
  for (const candidate of candidates) {
    if (!candidate || found.has(candidate)) continue;
    found.add(candidate);
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Try the next location. launchd's PATH often misses Homebrew.
    }
  }
  return '';
}

const gitBin = findExecutable('git');

function run(command, args, { cwd, allowFail = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd });
    const out = [];
    const err = [];
    child.stdout.on('data', (chunk) => out.push(chunk));
    child.stderr.on('data', (chunk) => err.push(chunk));
    child.on('error', (error) => {
      if (allowFail) resolve({ code: 127, stdout: '', stderr: String(error) });
      else reject(error);
    });
    child.on('close', (code) => {
      const stdout = Buffer.concat(out).toString('utf8');
      const stderr = Buffer.concat(err).toString('utf8');
      if (code === 0 || allowFail) resolve({ code: code ?? 1, stdout, stderr });
      else reject(new Error(stderr.trim() || stdout.trim() || `${path.basename(command)} exited ${code}`));
    });
  });
}

function git(cwd, args, options) {
  if (!gitBin) return Promise.reject(new Error('git is not installed'));
  return run(gitBin, args, { cwd, ...options });
}

async function gitLines(cwd, args) {
  const result = await git(cwd, args);
  return result.stdout.split('\n').map((line) => line.trim()).filter(Boolean);
}

function catFiles(cwd, requests) {
  if (!requests.length) return Promise.resolve([]);
  return new Promise((resolve, reject) => {
    const child = spawn(gitBin, ['cat-file', '--batch'], { cwd });
    const out = [];
    const err = [];
    child.stdout.on('data', (chunk) => out.push(chunk));
    child.stderr.on('data', (chunk) => err.push(chunk));
    child.on('error', reject);
    child.stdin.write(`${requests.join('\n')}\n`);
    child.stdin.end();
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(Buffer.concat(err).toString('utf8').trim() || `git cat-file exited ${code}`));
        return;
      }
      try {
        resolve(parseBatch(Buffer.concat(out), requests.length));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function parseBatch(buf, count) {
  const files = [];
  let offset = 0;
  for (let index = 0; index < count; index += 1) {
    const newline = buf.indexOf(0x0a, offset);
    if (newline < 0) throw new Error('truncated git cat-file output');
    const header = buf.slice(offset, newline).toString('utf8');
    offset = newline + 1;
    if (header.endsWith(' missing')) {
      files.push(null);
      continue;
    }
    const size = Number(header.split(' ').at(-1));
    if (!Number.isFinite(size)) throw new Error(`bad cat-file header: ${header}`);
    files.push(buf.slice(offset, offset + size));
    offset += size;
    if (buf[offset] === 0x0a) offset += 1;
  }
  return files;
}

async function readRefListings(root, ref) {
  const paths = (await gitLines(root, ['ls-tree', '-r', '--name-only', ref, '--', 'src/content/events']))
    .filter((file) => EVENT_MD.test(file));
  if (!paths.length) return [];
  const blobs = await catFiles(root, paths.map((file) => `${ref}:${file}`));
  return paths.flatMap((file, index) => {
    if (!blobs[index]) return [];
    return [parseListing(file, blobs[index].toString('utf8'))];
  });
}

export async function remoteListings(root) {
  await git(root, ['fetch', 'origin', 'main']);
  const inbox = await git(root, ['fetch', 'origin', inboxBranch], { allowFail: true });
  const main = await readRefListings(root, 'origin/main');
  if (inbox.code !== 0) return main;
  const pending = await readRefListings(root, `origin/${inboxBranch}`);
  return [...pending, ...main];
}

export async function stageInbox(repoDir, files) {
  for (const file of files) {
    if (!isInboxPath(file.path)) throw new Error(`refusing to publish ${file.path}`);
  }
  if (!files.length) return [];
  try {
    for (const file of files) {
      const dest = path.join(repoDir, file.path);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, file.contents);
    }
    await git(repoDir, ['add', '--', ...files.map((file) => file.path)]);
    const staged = await gitLines(repoDir, ['diff', '--cached', '--name-only', '--diff-filter=A']);
    const changed = await gitLines(repoDir, ['diff', '--cached', '--name-only', '--diff-filter=MD']);
    const wanted = files.map((file) => file.path);
    const unexpected = staged.filter((file) => !isInboxPath(file) || !wanted.includes(file));
    const missing = wanted.filter((file) => !staged.includes(file));
    if (unexpected.length || changed.length || missing.length) {
      const detail = [...unexpected, ...changed, ...missing.map((file) => `${file} (not added)`)].join(', ');
      throw new Error(`inbox publish is add-only under events and posters: ${detail}`);
    }
    return staged;
  } catch (error) {
    await git(repoDir, ['reset', '--hard'], { allowFail: true });
    await git(repoDir, ['clean', '-fd', '--', 'src/content/events', 'public/images/events'], { allowFail: true });
    throw error;
  }
}

function inboxBody(events) {
  const lines = events
    .map((event) => parseListing(event.path, event.raw))
    .sort((left, right) => left.date.localeCompare(right.date) || left.title.localeCompare(right.title))
    .map((event) => `- ${event.date}: ${event.title}${event.venue ? ` — ${event.venue}` : ''}`);
  return [
    'Upcoming events collected by the Bastropia event scout.',
    '',
    'This is the one rolling inbox. Each run resets `bot/events-inbox` onto `main` and keeps listings that are not already on the calendar and have not passed. Duplicates match by filename slug and by normalized title, date, and venue.',
    '',
    ...lines,
    '',
    'Only new files under `src/content/events/` and `public/images/events/` are included.',
    '',
  ].join('\n');
}

async function pushRef(cwd, sourceRef, expectedRemote) {
  const args = ['push'];
  if (expectedRemote) args.push(`--force-with-lease=refs/heads/${inboxBranch}:${expectedRemote}`);
  args.push('origin', `${sourceRef}:refs/heads/${inboxBranch}`);
  await git(cwd, args);
}

async function github(root) {
  const ghBin = findExecutable('gh');
  if (!ghBin) {
    throw new Error(
      'GitHub CLI (gh) is not available. The scout did not open a pull request. On the Mac that runs the 7:15 AM job, install gh and authenticate it (gh auth login, or set GH_TOKEN in the launchd environment).',
    );
  }
  return ghBin;
}

async function openInboxPrs(root, ghBin) {
  const listed = await run(ghBin, [
    'pr', 'list', '--head', inboxBranch, '--base', 'main', '--state', 'open', '--json', 'number,url',
  ], { cwd: root });
  return JSON.parse(listed.stdout || '[]');
}

async function writeBodyFile(body) {
  const dir = await mkdtemp(path.join(tmpdir(), 'bastropia-pr-'));
  const file = path.join(dir, 'body.md');
  await writeFile(file, body);
  return { dir, file };
}

async function removeUntracked(root, relativePaths) {
  for (const relativePath of relativePaths) {
    const status = await git(root, ['status', '--porcelain', '--', relativePath], { allowFail: true });
    if (status.code === 0 && status.stdout.startsWith('??')) {
      await rm(path.join(root, relativePath), { force: true });
    }
  }
}

function freshPaths(added) {
  const paths = [];
  for (const item of added) {
    paths.push(`src/content/events/${item.file}`);
    if (typeof item.image === 'string' && item.image.startsWith('/images/events/') && item.image.endsWith('.jpg')) {
      paths.push(`public${item.image}`);
    }
  }
  return paths;
}

export async function publishInbox({ root, today, added }) {
  if (inboxBranch === 'main' || inboxBranch === 'master') {
    throw new Error('refusing to publish the event inbox onto the default branch');
  }
  await git(root, ['fetch', 'origin', 'main']);
  const inboxFetch = await git(root, ['fetch', 'origin', inboxBranch], { allowFail: true });
  const hasInbox = inboxFetch.code === 0;
  const expectedRemote = hasInbox
    ? (await git(root, ['rev-parse', `origin/${inboxBranch}`])).stdout.trim()
    : '';

  const mainEventPaths = (await gitLines(root, ['ls-tree', '-r', '--name-only', 'origin/main', '--', 'src/content/events']))
    .filter((file) => EVENT_MD.test(file));
  const mainPosterPaths = (await gitLines(root, ['ls-tree', '-r', '--name-only', 'origin/main', '--', 'public/images/events']))
    .filter((file) => EVENT_POSTER.test(file));
  const mainPaths = new Set([...mainEventPaths, ...mainPosterPaths]);
  const mainBlobs = await catFiles(root, mainEventPaths.map((file) => `origin/main:${file}`));
  const mainEvents = mainEventPaths.flatMap((file, index) => (
    mainBlobs[index] ? [{ path: file, raw: mainBlobs[index].toString('utf8') }] : []
  ));

  let inboxAdditions = [];
  if (hasInbox) {
    const names = (await gitLines(root, [
      'diff', '--name-only', '--diff-filter=A', 'origin/main', `origin/${inboxBranch}`, '--',
      'src/content/events', 'public/images/events',
    ])).filter(isInboxPath);
    const blobs = await catFiles(root, names.map((file) => `origin/${inboxBranch}:${file}`));
    inboxAdditions = names.flatMap((file, index) => {
      if (!blobs[index]) return [];
      return [{
        path: file,
        raw: EVENT_MD.test(file) ? blobs[index].toString('utf8') : '',
        bytes: blobs[index],
      }];
    });
  }

  const fresh = [];
  for (const item of added) {
    const relativePath = `src/content/events/${item.file}`;
    let raw = '';
    try {
      raw = await readFile(path.join(root, relativePath), 'utf8');
    } catch {
      continue;
    }
    let posterPath = '';
    if (typeof item.image === 'string' && item.image.startsWith('/images/events/') && item.image.endsWith('.jpg')) {
      posterPath = `public${item.image}`;
    }
    fresh.push({ path: relativePath, raw, posterPath });
  }

  const plan = planInboxChanges({ today, mainEvents, mainPaths, inboxAdditions, fresh });
  const ghBin = plan.files.length || hasInbox ? await github(root) : '';
  const openPr = ghBin ? (await openInboxPrs(root, ghBin))[0] : null;
  const inboxBytes = new Map(inboxAdditions.map((entry) => [entry.path, entry.bytes]));
  const payloads = [];
  for (const file of plan.files) {
    if (file.source === 'fresh') {
      try {
        payloads.push({ path: file.path, contents: await readFile(path.join(root, file.path)) });
      } catch {
        // The poster was named but not saved. Keep the listing.
      }
    } else if (inboxBytes.has(file.path)) {
      payloads.push({ path: file.path, contents: inboxBytes.get(file.path) });
    }
  }
  const eventPayloads = payloads.filter((file) => file.path.endsWith('.md'));

  const parent = await mkdtemp(path.join(tmpdir(), 'bastropia-events-'));
  const worktree = path.join(parent, 'inbox');
  let summary = 'No new upcoming events. No pull request opened.';
  try {
    await git(root, ['worktree', 'add', '--detach', worktree, 'origin/main']);
    const staged = await stageInbox(worktree, payloads);
    let newTree = '';
    if (staged.length) {
      const againstMain = await gitLines(worktree, ['diff', '--cached', '--name-only', '--diff-filter=AMD']);
      const edits = await gitLines(worktree, ['diff', '--cached', '--name-only', '--diff-filter=MD']);
      const outside = againstMain.filter((file) => !isInboxPath(file));
      if (outside.length || edits.length) {
        throw new Error(`refusing to publish outside add-only event files: ${[...outside, ...edits].join(', ')}`);
      }
      await git(worktree, ['commit', '-m', 'Update the upcoming events inbox.']);
      newTree = (await git(worktree, ['rev-parse', 'HEAD^{tree}'])).stdout.trim();
    }
    const stagedEvents = staged.filter((file) => file.endsWith('.md'));
    const oldTree = hasInbox
      ? (await git(root, ['rev-parse', `origin/${inboxBranch}^{tree}`])).stdout.trim()
      : '';
    const action = decidePublish({
      fileCount: stagedEvents.length,
      treeMatchesRemote: Boolean(newTree) && newTree === oldTree,
      openPr: Boolean(openPr),
    });

    if (action === 'skip' && eventPayloads.length === 0) {
      summary = 'No new upcoming events. No pull request opened.';
    } else if (action === 'skip') {
      summary = openPr
        ? `Event inbox already matches this run (${openPr.url}). No new pull request opened.`
        : 'No new upcoming events. No pull request opened.';
    } else if (action === 'close') {
      if (hasInbox) await pushRef(root, 'origin/main', expectedRemote);
      await run(ghBin, [
        'pr', 'close', String(openPr.number),
        '--comment', 'Nothing new is left in the event inbox. Listings are already on main, or the date has passed.',
      ], { cwd: root });
      summary = `Closed the event inbox pull request ${openPr.url}. Nothing new was left.`;
    } else {
      await pushRef(worktree, 'HEAD', expectedRemote);
      const described = inboxBody(eventPayloads.map((file) => ({
        path: file.path,
        raw: file.contents.toString('utf8'),
      })));
      const body = await writeBodyFile(described);
      try {
        if (action === 'update') {
          await run(ghBin, ['pr', 'edit', String(openPr.number), '--title', inboxTitle, '--body-file', body.file], { cwd: root });
          summary = `Updated the event inbox pull request ${openPr.url}.`;
        } else {
          const created = await run(ghBin, [
            'pr', 'create', '--base', 'main', '--head', inboxBranch, '--title', inboxTitle, '--body-file', body.file,
          ], { cwd: root });
          summary = `Opened the event inbox pull request. ${created.stdout.trim()}`.trim();
        }
      } finally {
        await rm(body.dir, { recursive: true, force: true });
      }
    }
  } finally {
    await git(root, ['worktree', 'remove', '--force', worktree], { allowFail: true });
    await rm(parent, { recursive: true, force: true });
  }

  await removeUntracked(root, freshPaths(added));
  return { ok: true, summary };
}
