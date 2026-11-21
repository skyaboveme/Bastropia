import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { publishInbox, stageInbox } from './event-inbox.mjs';
import { alreadyListed, decidePublish, identityKey, planInboxChanges } from './event-match.mjs';

const today = '2026-11-21';

function eventFile(file, title, start, venue, end = '') {
  const endLine = end ? `\nend: "${end}"` : '';
  return {
    path: `src/content/events/${file}`,
    raw: `---\ntitle: ${JSON.stringify(title)}\nstart: "${start}"${endLine}\nvenue: ${JSON.stringify(venue)}\n---\n\nBody.\n`,
  };
}

test('duplicate checks use slug and normalized title, date, and venue', () => {
  const listed = [{
    file: 'fame-days-gratitude-2026-11-06.md',
    title: 'F.A.M.E. Days: Gratitude & Community Traditions',
    date: '2026-11-06',
    venue: 'Pine Street, downtown Bastrop',
    sourceUrl: 'https://example.com/gratitude',
  }];
  const crafts = {
    title: 'FAME Day at the Museum: Holiday Crafts',
    date: '2026-12-04',
    venue: 'Bastrop County Museum & Visitor Center',
    sourceUrl: 'https://example.com/crafts',
  };
  assert.equal(alreadyListed(crafts, listed), false);
  assert.equal(alreadyListed({
    title: 'Wassail Fest',
    date: '2026-11-28',
    venue: 'Bastrop County Museum & Visitor Center',
  }, [{
    file: 'holiday-traditions-from-around-the-world-2026-11-28.md',
    title: 'Holiday Traditions from Around the World',
    date: '2026-11-28',
    venue: 'Bastrop County Museum & Visitor Center',
  }]), false);

  const luncheon = {
    title: 'December 2026 Chamber Luncheon',
    date: '2026-12-02',
    venue: 'Bastrop Convention & Exhibit Center',
  };
  assert.equal(alreadyListed(luncheon, [{
    file: 'other-name.md',
    title: 'December 2026 Chamber Luncheon',
    date: '2026-12-02',
    venue: 'Bastrop Convention and Exhibit Center',
  }]), true);
  assert.equal(identityKey(luncheon.title, luncheon.date, luncheon.venue), identityKey(
    'December 2026 Chamber Luncheon',
    '2026-12-02T11:15:00-06:00',
    'Bastrop Convention and Exhibit Center',
  ));
  assert.equal(alreadyListed({ ...luncheon, venue: 'A different room' }, [{
    file: 'somewhere-else.md',
    title: luncheon.title,
    date: luncheon.date,
    venue: 'Bastrop Convention & Exhibit Center',
  }]), false);
  assert.equal(alreadyListed({
    ...luncheon,
    file: 'december-2026-chamber-luncheon-2026-12-02.md',
  }, [{
    file: 'december-2026-chamber-luncheon-2026-12-02.md',
    title: 'Different title',
    date: '2026-12-03',
    venue: 'Somewhere else',
  }]), true);
});

test('inbox plan keeps upcoming additions and drops duplicates, past events, and other paths', () => {
  const onMain = eventFile('on-main.md', 'Already Listed', '2026-12-01T00:00:00-06:00', 'Main Hall');
  const plan = planInboxChanges({
    today,
    mainEvents: [onMain],
    mainPaths: new Set([onMain.path, 'public/images/events/on-main.jpg']),
    inboxAdditions: [
      eventFile('future-concert-2026-12-20.md', 'Future Concert', '2026-12-20T19:00:00-06:00', 'Park'),
      { path: 'public/images/events/future-concert-2026-12-20.jpg' },
      eventFile('past-social-2026-11-01.md', 'Past Social', '2026-11-01T10:00:00-06:00', 'Park', '2026-11-10T12:00:00-06:00'),
      eventFile('holiday-exhibit-2026-11-01.md', 'Holiday Exhibit', '2026-11-01T00:00:00-06:00', 'Museum', '2026-12-31T00:00:00-06:00'),
      eventFile('already-listed-copy.md', 'Already Listed', '2026-12-01T18:00:00-06:00', 'Main Hall'),
      { path: 'src/pages/extra.astro', raw: 'nope' },
      { path: 'public/images/events/past-social-2026-11-01.jpg' },
    ],
    fresh: [
      eventFile('future-concert-2026-12-20.md', 'Future Concert', '2026-12-20T19:00:00-06:00', 'Park'),
      {
        ...eventFile('chamber-lunch-2026-12-02.md', 'Chamber Lunch', '2026-12-02T11:00:00-06:00', 'Convention Center'),
        posterPath: 'public/images/events/chamber-lunch-2026-12-02.jpg',
      },
      eventFile('same-hour-other-room.md', 'Chamber Lunch', '2026-12-02T11:00:00-06:00', 'Library'),
    ],
  });

  assert.deepEqual(plan.files.map((file) => file.path).sort(), [
    'public/images/events/chamber-lunch-2026-12-02.jpg',
    'public/images/events/future-concert-2026-12-20.jpg',
    'src/content/events/chamber-lunch-2026-12-02.md',
    'src/content/events/future-concert-2026-12-20.md',
    'src/content/events/holiday-exhibit-2026-11-01.md',
    'src/content/events/same-hour-other-room.md',
  ]);
  assert.equal(plan.skipped.some((item) => item.path.endsWith('past-social-2026-11-01.md') && item.reason === 'already passed'), true);
  assert.equal(plan.skipped.some((item) => item.path === 'src/pages/extra.astro'), true);
  assert.equal(plan.skipped.some((item) => item.path.endsWith('already-listed-copy.md') && item.reason === 'duplicate'), true);
  assert.equal(plan.files.some((file) => file.path.includes('past-social') || file.path.endsWith('.astro')), false);
});

test('an empty inbox opens nothing, and an existing pull request is updated instead of replaced', () => {
  assert.equal(decidePublish({ fileCount: 0, treeMatchesRemote: false, openPr: false }), 'skip');
  assert.equal(decidePublish({ fileCount: 0, treeMatchesRemote: false, openPr: true }), 'close');
  assert.equal(decidePublish({ fileCount: 2, treeMatchesRemote: true, openPr: true }), 'skip');
  assert.equal(decidePublish({ fileCount: 2, treeMatchesRemote: true, openPr: false }), 'open');
  assert.equal(decidePublish({ fileCount: 2, treeMatchesRemote: false, openPr: true }), 'update');
  assert.equal(decidePublish({ fileCount: 2, treeMatchesRemote: false, openPr: false }), 'open');
});

function git(cwd, args) {
  execFileSync('git', args, { cwd, stdio: 'pipe' });
}

test('stageInbox refuses edits and files outside the events inbox', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'inbox-stage-'));
  git(dir, ['init', '-b', 'main']);
  git(dir, ['config', 'user.email', 'scout@example.com']);
  git(dir, ['config', 'user.name', 'Scout Test']);
  await mkdir(path.join(dir, 'src/content/events'), { recursive: true });
  await writeFile(path.join(dir, 'src/content/events/existing.md'), '---\ntitle: "Existing"\n');
  await writeFile(path.join(dir, 'README.md'), 'hi\n');
  git(dir, ['add', '.']);
  git(dir, ['commit', '-m', 'base']);

  const staged = await stageInbox(dir, [
    { path: 'src/content/events/new-event.md', contents: Buffer.from('---\ntitle: "New"\n') },
    { path: 'public/images/events/new-event.jpg', contents: Buffer.from('poster-bytes') },
  ]);
  assert.deepEqual(staged.sort(), [
    'public/images/events/new-event.jpg',
    'src/content/events/new-event.md',
  ]);
  git(dir, ['commit', '-m', 'add event']);

  await assert.rejects(
    () => stageInbox(dir, [{ path: 'src/content/events/existing.md', contents: Buffer.from('changed\n') }]),
    /add-only/,
  );
  assert.equal(execFileSync('git', ['status', '--porcelain'], { cwd: dir, encoding: 'utf8' }), '');
  await assert.rejects(
    () => stageInbox(dir, [{ path: 'src/pages/index.astro', contents: Buffer.from('nope') }]),
    /refusing to publish/,
  );
  assert.equal(execFileSync('git', ['status', '--porcelain'], { cwd: dir, encoding: 'utf8' }), '');
  await rm(dir, { recursive: true, force: true });
});

test('publish keeps one inbox branch and does not open a pull request when nothing is new', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'inbox-publish-'));
  const bare = path.join(root, 'remote.git');
  const clone = path.join(root, 'clone');
  const bin = path.join(root, 'bin');
  const log = path.join(root, 'gh.log');
  const prs = path.join(root, 'prs.json');
  await mkdir(bin, { recursive: true });
  await writeFile(path.join(bin, 'gh'), `#!/bin/sh
printf '%s\\n' "$*" >> "$GH_LOG"
if [ "$1" = "pr" ] && [ "$2" = "list" ]; then
  if [ -f "$GH_PRS" ]; then cat "$GH_PRS"; else printf '%s\\n' '[]'; fi
  exit 0
fi
if [ "$1" = "pr" ] && [ "$2" = "create" ]; then
  printf '%s\\n' '[{"number":999,"url":"https://example.com/pull/999"}]' > "$GH_PRS"
  printf '%s\\n' 'https://example.com/pull/999'
  exit 0
fi
if [ "$1" = "pr" ] && [ "$2" = "edit" ]; then
  exit 0
fi
if [ "$1" = "pr" ] && [ "$2" = "close" ]; then
  printf '%s\\n' '[]' > "$GH_PRS"
  exit 0
fi
echo "unexpected gh: $*" >&2
exit 1
`);
  await chmod(path.join(bin, 'gh'), 0o755);
  git(root, ['init', '--bare', '-b', 'main', bare]);
  git(root, ['clone', bare, clone]);
  git(clone, ['config', 'user.email', 'scout@example.com']);
  git(clone, ['config', 'user.name', 'Scout Test']);

  const writeEvent = async (cwd, file, title, start, venue, end = '') => {
    const full = path.join(cwd, 'src/content/events', file);
    await mkdir(path.dirname(full), { recursive: true });
    const endLine = end ? `\nend: "${end}"` : '';
    await writeFile(full, `---\ntitle: ${JSON.stringify(title)}\nstart: "${start}"${endLine}\nvenue: ${JSON.stringify(venue)}\n---\n\n${title}\n`);
  };

  await writeEvent(clone, 'on-main.md', 'Already Listed', '2026-12-01T00:00:00-06:00', 'Main Hall');
  git(clone, ['add', '.']);
  git(clone, ['commit', '-m', 'main event']);
  git(clone, ['push', '-u', 'origin', 'main']);
  git(clone, ['checkout', '-b', 'bot/events-inbox']);
  await writeEvent(clone, 'future-concert-2026-12-20.md', 'Future Concert', '2026-12-20T19:00:00-06:00', 'Park');
  await mkdir(path.join(clone, 'public/images/events'), { recursive: true });
  await writeFile(path.join(clone, 'public/images/events/future-concert-2026-12-20.jpg'), Buffer.from([0xff, 0xd8, 0x11, 0x22]));
  await writeEvent(clone, 'past-social-2026-11-01.md', 'Past Social', '2026-11-01T10:00:00-06:00', 'Park', '2026-11-10T12:00:00-06:00');
  await writeEvent(clone, 'holiday-exhibit-2026-11-01.md', 'Holiday Exhibit', '2026-11-01T00:00:00-06:00', 'Museum', '2026-12-31T00:00:00-06:00');
  await writeEvent(clone, 'already-listed-copy.md', 'Already Listed', '2026-12-01T18:00:00-06:00', 'Main Hall');
  await writeFile(path.join(clone, 'src/content/events/on-main.md'), '---\ntitle: "Changed on the inbox"\n');
  await mkdir(path.join(clone, 'src/pages'), { recursive: true });
  await writeFile(path.join(clone, 'src/pages/extra.astro'), 'nope\n');
  git(clone, ['add', '.']);
  git(clone, ['commit', '-m', 'inbox pile']);
  git(clone, ['push', '-u', 'origin', 'bot/events-inbox']);
  git(clone, ['checkout', 'main']);

  await writeEvent(clone, 'chamber-lunch-2026-12-02.md', 'Chamber Lunch', '2026-12-02T11:00:00-06:00', 'Convention Center');
  const previousPath = process.env.PATH;
  const previousLog = process.env.GH_LOG;
  const previousPrs = process.env.GH_PRS;
  process.env.PATH = `${bin}${path.delimiter}${previousPath}`;
  process.env.GH_LOG = log;
  process.env.GH_PRS = prs;
  try {
    const first = await publishInbox({
      root: clone,
      today,
      added: [{ file: 'chamber-lunch-2026-12-02.md', image: '' }],
    });
    assert.match(first.summary, /Opened the event inbox/);
    const diff = execFileSync('git', ['diff', '--name-only', 'origin/main', 'origin/bot/events-inbox'], { cwd: clone, encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean)
      .sort();
    assert.deepEqual(diff, [
      'src/content/events/chamber-lunch-2026-12-02.md',
      'src/content/events/future-concert-2026-12-20.md',
      'src/content/events/holiday-exhibit-2026-11-01.md',
      'public/images/events/future-concert-2026-12-20.jpg',
    ].sort());
    const poster = execFileSync('git', ['show', 'origin/bot/events-inbox:public/images/events/future-concert-2026-12-20.jpg'], { cwd: clone });
    assert.deepEqual([...poster], [0xff, 0xd8, 0x11, 0x22]);
    await assert.rejects(() => readFile(path.join(clone, 'src/content/events/chamber-lunch-2026-12-02.md')));
    const mainCopy = await readFile(path.join(clone, 'src/content/events/on-main.md'), 'utf8');
    assert.match(mainCopy, /Already Listed/);

    const second = await publishInbox({ root: clone, today, added: [] });
    assert.match(second.summary, /already matches|No new upcoming events/);
    const calls = (await readFile(log, 'utf8')).trim().split('\n');
    assert.equal(calls.filter((line) => line.startsWith('pr create')).length, 1);

    const third = await publishInbox({ root: clone, today: '2027-06-01', added: [] });
    assert.match(third.summary, /Closed the event inbox/);
    const remaining = execFileSync('git', ['diff', '--name-only', 'origin/main', 'origin/bot/events-inbox'], { cwd: clone, encoding: 'utf8' }).trim();
    assert.equal(remaining, '');
    const after = (await readFile(log, 'utf8')).trim().split('\n');
    assert.equal(after.filter((line) => line.startsWith('pr create')).length, 1);
    assert.equal(after.filter((line) => line.startsWith('pr close')).length, 1);
  } finally {
    process.env.PATH = previousPath;
    if (previousLog === undefined) delete process.env.GH_LOG;
    else process.env.GH_LOG = previousLog;
    if (previousPrs === undefined) delete process.env.GH_PRS;
    else process.env.GH_PRS = previousPrs;
    await rm(root, { recursive: true, force: true });
  }
});
