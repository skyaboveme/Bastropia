/**
 * Decide whether a pull request may be squash-merged without a person.
 *
 * The auto-merge job checks this file out from the default branch. A pull
 * request that edits the gate is outside the allowlist, so it cannot change
 * the rules and then merge itself.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const COMMENT_MARKER = '<!-- bastropia-content-auto-merge -->';

export const ALLOWLIST_LINES = [
  '`src/content/news/<slug>.md` and `src/content/news/<slug>.mdx`',
  '`public/images/news/<slug>.jpg`',
  '`public/images/news/<slug>/<photo>.jpg`',
  '`public/images/social/<slug>-ig.jpg`',
  '`public/media/bastropia-daily-YYYY-MM-DD.mp4`',
  '`public/media/bastropia-daily-YYYY-MM-DD-short.mp4`',
  '`public/media/bastropia-daily-YYYY-MM-DD-poster.jpg`',
];

const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const NEWS_DOC = /^[A-Za-z0-9][A-Za-z0-9._-]*\.mdx?$/;
const JPG = /^[A-Za-z0-9][A-Za-z0-9._-]*\.jpg$/;
const IG_CARD = /^[A-Za-z0-9][A-Za-z0-9._-]*-ig\.jpg$/;
const DAILY = /^bastropia-daily-(\d{4})-(\d{2})-(\d{2})(\.mp4|-short\.mp4|-poster\.jpg)$/;
const KNOWN_STATUSES = new Set(['added', 'modified', 'removed', 'renamed', 'copied', 'changed', 'unchanged']);

function segments(filePath) {
  if (typeof filePath !== 'string' || filePath.length === 0 || filePath.length > 400) return null;
  if (filePath.includes('\\') || filePath.startsWith('/') || filePath.includes('//')) return null;
  const parts = filePath.split('/');
  if (parts.some((part) => !SEGMENT.test(part))) return null;
  return parts;
}

function isRealUtcDate(year, month, day) {
  if (year < 2000 || year > 2100) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isDailyMedia(name) {
  const match = DAILY.exec(name);
  if (!match) return false;
  return isRealUtcDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

export function isAllowedContentPath(filePath) {
  const parts = segments(filePath);
  if (!parts) return false;
  if (parts.length === 4 && parts[0] === 'src' && parts[1] === 'content' && parts[2] === 'news') {
    return NEWS_DOC.test(parts[3]);
  }
  if (parts.length === 4 && parts[0] === 'public' && parts[1] === 'images' && parts[2] === 'news') {
    return JPG.test(parts[3]);
  }
  if (parts.length === 5 && parts[0] === 'public' && parts[1] === 'images' && parts[2] === 'news') {
    return JPG.test(parts[4]);
  }
  if (parts.length === 4 && parts[0] === 'public' && parts[1] === 'images' && parts[2] === 'social') {
    return IG_CARD.test(parts[3]);
  }
  if (parts.length === 3 && parts[0] === 'public' && parts[1] === 'media') {
    return isDailyMedia(parts[2]);
  }
  return false;
}

function reasonFor(filename, status, previous, bad) {
  if (status === 'renamed' || status === 'copied') {
    const oldBad = bad.includes(previous);
    const newBad = bad.includes(filename);
    if (oldBad && newBad) {
      return `\`${previous}\` and \`${filename}\` (${status}) are outside the content allowlist.`;
    }
    if (oldBad) return `\`${previous}\` (${status} source) is outside the content allowlist.`;
    return `\`${filename}\` (${status} destination) is outside the content allowlist.`;
  }
  if (status === 'removed') return `\`${filename}\` (deleted) is outside the content allowlist.`;
  return `\`${filename}\` (${status}) is outside the content allowlist.`;
}

export function classifyFiles(files, { truncated = false } = {}) {
  if (!Array.isArray(files)) {
    return {
      eligible: false,
      reasons: ['The changed-file list was not readable.'],
      allowed: [],
      blocked: [],
      truncated: false,
    };
  }

  const allowed = [];
  const blocked = [];
  for (const file of files) {
    const filename = typeof file?.filename === 'string' ? file.filename : '';
    const status = typeof file?.status === 'string' ? file.status : '';
    const previous = typeof file?.previous_filename === 'string' ? file.previous_filename : '';
    if (!filename || !KNOWN_STATUSES.has(status)) {
      blocked.push({
        path: filename || '(missing path)',
        status: status || '(missing status)',
        reason: `\`${filename || '(missing path)'}\` has status \`${status || '(missing)'}\`, which this gate does not accept.`,
      });
      continue;
    }
    if ((status === 'renamed' || status === 'copied') && !previous) {
      blocked.push({
        path: filename,
        status,
        reason: `\`${filename}\` is ${status} and the previous path was not reported.`,
      });
      continue;
    }
    const paths = status === 'renamed' || status === 'copied' ? [previous, filename] : [filename];
    const bad = paths.filter((entry) => !isAllowedContentPath(entry));
    if (bad.length) {
      blocked.push({ path: filename, status, previous, reason: reasonFor(filename, status, previous, bad) });
    } else {
      allowed.push({ path: filename, status, previous });
    }
  }

  const reasons = [];
  if (truncated) reasons.push('The changed-file list was incomplete, so this pull request cannot auto-merge.');
  if (files.length === 0) reasons.push('The pull request does not change any files.');
  for (const item of blocked) reasons.push(item.reason);
  return {
    eligible: reasons.length === 0 && allowed.length > 0,
    reasons,
    allowed,
    blocked,
    truncated,
  };
}

export function isForkPullRequest(pullRequest, repo) {
  const head = pullRequest?.head?.repo;
  const baseName = pullRequest?.base?.repo?.full_name;
  if (!head) return true;
  if (head.fork) return true;
  if (head.full_name !== repo) return true;
  if (baseName && baseName !== repo) return true;
  return false;
}

export function mergeDecision({
  classification,
  fork = false,
  draft = false,
  baseBranch,
  defaultBranch = 'main',
  headMatches = false,
  state = 'open',
  merged = false,
  buildConclusion = '',
}) {
  const reasons = [];
  if (fork) reasons.push('The pull request comes from a fork.');
  if (draft) reasons.push('The pull request is a draft.');
  if (baseBranch !== defaultBranch) {
    reasons.push(`The base branch is \`${baseBranch || '(missing)'}\`. Auto-merge runs for \`${defaultBranch}\`.`);
  }
  if (!headMatches) reasons.push('This build is for an older commit than the current pull request head.');
  if (merged) reasons.push('The pull request is already merged.');
  else if (state !== 'open') reasons.push('The pull request is closed.');
  if (buildConclusion !== 'success') {
    reasons.push(`The pull request build finished as \`${buildConclusion || 'missing'}\`.`);
  }
  if (!classification?.eligible) reasons.push(...(classification?.reasons ?? ['The changed-file list was not readable.']));
  return { merge: reasons.length === 0, reasons };
}

export function shouldDispatchExisting({
  mergedBy,
  deployCovered,
  classification,
  fork,
  buildConclusion,
  headMatches,
}) {
  return Boolean(
    mergedBy === 'github-actions[bot]' &&
      !deployCovered &&
      classification?.eligible &&
      !fork &&
      buildConclusion === 'success' &&
      headMatches,
  );
}

export function shouldKeepExistingComment(existingBody, nextBody) {
  if (!existingBody?.includes('### Content auto-merge: merged')) return false;
  return !nextBody.includes('### Content auto-merge: merged');
}

export function renderComment(report) {
  const lines = [COMMENT_MARKER, ''];
  if (report.outcome === 'merged' || report.outcome === 'already-merged') {
    lines.push('### Content auto-merge: merged', '');
  } else if (report.outcome === 'deploy-failed') {
    lines.push('### Content auto-merge: merged, deploy failed', '');
  } else if (report.outcome === 'merge-failed') {
    lines.push('### Content auto-merge: left for review', '');
    lines.push('The pull request qualified, and GitHub rejected the merge.', '');
  } else {
    lines.push('### Content auto-merge: left for review', '');
    lines.push('This pull request was not auto-merged.', '');
  }
  if (report.summary) lines.push(report.summary, '');
  if (report.reasons?.length) {
    lines.push('**Why**', '');
    const shown = report.reasons.slice(0, 40);
    for (const reason of shown) lines.push(`- ${reason}`);
    if (report.reasons.length > shown.length) {
      lines.push(`- ${report.reasons.length - shown.length} more files are outside the allowlist.`);
    }
    lines.push('');
  }
  if (report.buildUrl) {
    lines.push(`Build: [${report.buildConclusion || 'result'}](${report.buildUrl}) for \`${report.headSha || 'unknown'}\`.`, '');
  }
  lines.push('**Allowlist**', '');
  for (const item of ALLOWLIST_LINES) lines.push(`- ${item}`);
  lines.push('');
  lines.push(
    'An addition or edit qualifies when its path is on that list. A deletion qualifies when the deleted path is on the list. A rename or copy qualifies when the old path and the new path are both on the list. A pull request from a fork stays open.',
  );
  lines.push('');
  return lines.join('\n');
}

function printClassification(result) {
  console.log(result.eligible ? 'eligible' : 'blocked');
  if (result.eligible) {
    for (const file of result.allowed) console.log(`  ${file.status} ${file.path}`);
    return;
  }
  for (const reason of result.reasons) console.log(`- ${reason}`);
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Usage: node scripts/content-pr-allowlist.mjs <files.json>');
    process.exit(1);
  }
  const parsed = JSON.parse(readFileSync(fileArg, 'utf8'));
  const files = Array.isArray(parsed) ? parsed : parsed.files;
  const result = classifyFiles(files, { truncated: Boolean(parsed.truncated) });
  printClassification(result);
  process.exit(result.eligible ? 0 : 1);
}
