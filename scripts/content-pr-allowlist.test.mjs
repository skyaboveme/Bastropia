import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  classifyFiles,
  isAllowedContentPath,
  isForkPullRequest,
  mergeDecision,
  renderComment,
  shouldDispatchExisting,
  shouldKeepExistingComment,
} from './content-pr-allowlist.mjs';

function load(number) {
  return JSON.parse(readFileSync(new URL(`./fixtures/content-prs/pr-${number}.json`, import.meta.url), 'utf8'));
}

function files(...rows) {
  return rows.map(([filename, status, previous]) => ({
    filename,
    status,
    ...(previous ? { previous_filename: previous } : {}),
  }));
}

const openContent = {
  classification: null,
  fork: false,
  draft: false,
  baseBranch: 'main',
  defaultBranch: 'main',
  headMatches: true,
  state: 'open',
  merged: false,
  buildConclusion: 'success',
};

test('recorded pull requests', () => {
  const pr46 = classifyFiles(load(46));
  const pr47 = classifyFiles(load(47));
  const pr48 = classifyFiles(load(48));
  const pr49 = classifyFiles(load(49));
  const pr50 = classifyFiles(load(50));

  assert.equal(pr46.eligible, false);
  assert.deepEqual(pr46.blocked.map((file) => file.path), ['src/pages/advertise.astro']);

  assert.equal(pr47.eligible, false);
  assert.deepEqual(pr47.blocked.map((file) => file.path), ['src/pages/index.astro']);
  assert.ok(pr47.allowed.some((file) => file.path.endsWith('.mdx')));
  assert.ok(pr47.allowed.some((file) => file.path.endsWith('-ig.jpg')));

  assert.equal(pr49.eligible, false);
  assert.deepEqual(pr49.blocked.map((file) => file.path), ['src/pages/index.astro']);

  assert.equal(pr50.eligible, true);
  assert.deepEqual(
    pr50.allowed.map((file) => file.path).sort(),
    [
      'public/media/bastropia-daily-2026-11-21-poster.jpg',
      'public/media/bastropia-daily-2026-11-21-short.mp4',
      'public/media/bastropia-daily-2026-11-21.mp4',
    ],
  );

  assert.equal(pr48.eligible, false);
  const blocked48 = new Set(pr48.blocked.map((file) => file.path));
  assert.ok(blocked48.has('package.json'));
  assert.ok(blocked48.has('src/components/PhotoCarousel.astro'));
  assert.ok(blocked48.has('scripts/decode-news-images.mjs'));
  assert.ok(blocked48.has('scripts/image-payloads/images/social/this-week-in-bastrop-county-history-nov-20-26-2026-ig.jpg.b64'));
  assert.equal(
    pr48.allowed.map((file) => file.path).join(','),
    'src/content/news/this-week-in-bastrop-county-history-nov-20-26-2026.mdx',
  );

  const newsOnly = classifyFiles(load(49).filter((file) => file.filename !== 'src/pages/index.astro'));
  assert.equal(newsOnly.eligible, true);
});

test('history carousel images qualify and other collections do not', () => {
  const history = classifyFiles(files(
    ['src/content/news/this-week-in-bastrop-county-history-nov-20-26-2026.mdx', 'added'],
    ['public/images/news/this-week-in-bastrop-county-history-nov-20-26-2026.jpg', 'added'],
    ['public/images/news/this-week-in-bastrop-county-history-nov-20-26-2026/map-1887.jpg', 'added'],
    ['public/images/social/this-week-in-bastrop-county-history-nov-20-26-2026-ig.jpg', 'added'],
  ));
  assert.equal(history.eligible, true);

  const events = classifyFiles(files(
    ['src/content/news/story.md', 'added'],
    ['src/content/events/hanging-of-the-greens-2026-11-22.md', 'added'],
  ));
  assert.equal(events.eligible, false);
  assert.ok(events.blocked.some((file) => file.path.startsWith('src/content/events/')));
});

test('deletions and renames outside the allowlist disqualify the pull request', () => {
  assert.equal(classifyFiles(files(['src/content/news/story.md', 'removed'])).eligible, true);
  assert.equal(classifyFiles(files(['src/pages/index.astro', 'removed'])).eligible, false);
  assert.equal(
    classifyFiles(files(['src/content/news/renamed.md', 'renamed', 'src/content/news/original.md'])).eligible,
    true,
  );
  const intoNews = classifyFiles(files(['src/content/news/story.md', 'renamed', 'src/pages/index.astro']));
  assert.equal(intoNews.eligible, false);
  assert.match(intoNews.reasons[0], /src\/pages\/index\.astro/);

  const outOfNews = classifyFiles(files(['src/pages/index.astro', 'renamed', 'src/content/news/story.md']));
  assert.equal(outOfNews.eligible, false);

  assert.equal(
    classifyFiles(files(['src/content/news/story.md', 'copied', 'src/components/StatBox.astro'])).eligible,
    false,
  );
  assert.equal(classifyFiles(files(['src/content/news/story.md', 'renamed'])).eligible, false);
  assert.match(classifyFiles(files(['src/content/news/story.md', 'renamed'])).reasons[0], /previous path/);
});

test('path shapes stay narrow', () => {
  assert.equal(isAllowedContentPath('src/content/news/story.md'), true);
  assert.equal(isAllowedContentPath('src/content/news/story.mdx'), true);
  assert.equal(isAllowedContentPath('src/content/news/story.MDX'), false);
  assert.equal(isAllowedContentPath('src/content/news/nested/story.md'), false);
  assert.equal(isAllowedContentPath('src/content/news/../pages/index.astro'), false);
  assert.equal(isAllowedContentPath('public/images/news/story.png'), false);
  assert.equal(isAllowedContentPath('public/images/news/story.JPG'), false);
  assert.equal(isAllowedContentPath('public/images/social/story.jpg'), false);
  assert.equal(isAllowedContentPath('public/images/social/story-ig.jpg'), true);
  assert.equal(isAllowedContentPath('public/images/news/story/photo/extra.jpg'), false);
  assert.equal(isAllowedContentPath('public/media/bastropia-daily-2026-11-21.mp4'), true);
  assert.equal(isAllowedContentPath('public/media/bastropia-daily-2026-11-21-short.mp4'), true);
  assert.equal(isAllowedContentPath('public/media/bastropia-daily-2026-11-21-poster.jpg'), true);
  assert.equal(isAllowedContentPath('public/media/bastropia-daily-2026-11-15-v2.mp4'), false);
  assert.equal(isAllowedContentPath('public/media/bastropia-daily-2026-02-31.mp4'), false);
  assert.equal(isAllowedContentPath('public/media/bastropia-daily-2024-02-29.mp4'), true);
  assert.equal(isAllowedContentPath('.github/workflows/auto-merge-content.yml'), false);
  assert.equal(classifyFiles([]).eligible, false);
  assert.equal(classifyFiles(files(['src/content/news/story.md', 'added']), { truncated: true }).eligible, false);
});

test('forks, drafts, and failed builds do not merge', () => {
  const classification = classifyFiles(load(50));
  assert.equal(mergeDecision({ ...openContent, classification }).merge, true);
  assert.equal(mergeDecision({ ...openContent, classification, fork: true }).merge, false);
  assert.equal(mergeDecision({ ...openContent, classification, draft: true }).merge, false);
  assert.equal(mergeDecision({ ...openContent, classification, buildConclusion: 'failure' }).merge, false);
  assert.equal(mergeDecision({ ...openContent, classification, headMatches: false }).merge, false);
  assert.equal(mergeDecision({ ...openContent, classification: classifyFiles(load(46)) }).merge, false);

  const repo = 'skyaboveme/Bastropia';
  assert.equal(isForkPullRequest({ head: { repo: { full_name: repo, fork: false } }, base: { repo: { full_name: repo } } }, repo), false);
  assert.equal(isForkPullRequest({ head: { repo: { full_name: 'other/Bastropia', fork: true } }, base: { repo: { full_name: repo } } }, repo), true);
  assert.equal(isForkPullRequest({ head: { repo: null } }, repo), true);
});

test('a merged bot pull request dispatches deploy once', () => {
  const classification = classifyFiles(load(50));
  assert.equal(shouldDispatchExisting({
    mergedBy: 'github-actions[bot]',
    deployCovered: false,
    classification,
    fork: false,
    buildConclusion: 'success',
    headMatches: true,
  }), true);
  assert.equal(shouldDispatchExisting({
    mergedBy: 'skyaboveme',
    deployCovered: false,
    classification,
    fork: false,
    buildConclusion: 'success',
    headMatches: true,
  }), false);
  assert.equal(shouldDispatchExisting({
    mergedBy: 'github-actions[bot]',
    deployCovered: true,
    classification,
    fork: false,
    buildConclusion: 'success',
    headMatches: true,
  }), false);
});

test('comments explain the decision and keep a merged note', () => {
  const skipped = renderComment({
    outcome: 'skipped',
    reasons: classifyFiles(load(46)).reasons,
    buildConclusion: 'success',
    buildUrl: 'https://example.test/build',
    headSha: 'abc',
  });
  assert.match(skipped, /bastropia-content-auto-merge/);
  assert.match(skipped, /left for review/);
  assert.match(skipped, /src\/pages\/advertise\.astro/);
  assert.match(skipped, /public\/media\/bastropia-daily-YYYY-MM-DD\.mp4/);
  assert.match(skipped, /fork stays open/);

  const merged = renderComment({
    outcome: 'merged',
    summary: 'Squash-merged `abc` as `def`. Deploy was started for `def` by dispatching the Deploy workflow.',
    buildConclusion: 'success',
    buildUrl: 'https://example.test/build',
    headSha: 'abc',
  });
  assert.match(merged, /### Content auto-merge: merged/);
  assert.match(merged, /Deploy was started/);
  assert.equal(shouldKeepExistingComment(merged, skipped), true);
  assert.equal(shouldKeepExistingComment(skipped, merged), false);
});

test('this change is outside the allowlist', () => {
  const own = classifyFiles(files(
    ['.github/workflows/deploy.yml', 'modified'],
    ['.github/workflows/pull-request-build.yml', 'added'],
    ['.github/workflows/auto-merge-content.yml', 'added'],
    ['scripts/content-pr-allowlist.mjs', 'added'],
    ['scripts/content-auto-merge.mjs', 'added'],
    ['scripts/content-pr-allowlist.test.mjs', 'added'],
    ['scripts/fixtures/content-prs/pr-50.json', 'added'],
  ));
  assert.equal(own.eligible, false);
  assert.equal(own.blocked.length, 7);
});

test('workflows keep the gate and the deploy token apart', () => {
  const root = new URL('../.github/workflows/', import.meta.url);
  const auto = readFileSync(new URL('auto-merge-content.yml', root), 'utf8');
  const build = readFileSync(new URL('pull-request-build.yml', root), 'utf8');
  const deploy = readFileSync(new URL('deploy.yml', root), 'utf8');

  assert.match(auto, /workflows: \["Pull request build"\]/);
  assert.match(auto, /ref: \$\{\{ github\.event\.repository\.default_branch \}\}/);
  assert.match(auto, /persist-credentials: false/);
  assert.match(auto, /contents: write/);
  assert.match(auto, /actions: write/);
  assert.doesNotMatch(auto, /pull_request_target/);
  const checkout = auto.slice(auto.indexOf('Checkout the gate'), auto.indexOf('Setup Node'));
  assert.match(checkout, /default_branch/);
  assert.doesNotMatch(checkout, /head_sha/);

  assert.match(build, /contents: read/);
  assert.match(build, /persist-credentials: false/);
  assert.match(build, /npm ci/);
  assert.match(build, /npm run build/);
  assert.doesNotMatch(build, /contents: write/);
  assert.doesNotMatch(build, /CLOUDFLARE_API_TOKEN/);

  assert.match(deploy, /workflow_dispatch:/);
  assert.match(deploy, /ref="main"/);
  assert.match(deploy, /npx wrangler deploy/);
  assert.doesNotMatch(deploy.split('name: Deploy to Cloudflare')[0], /CLOUDFLARE_API_TOKEN/);
  assert.match(deploy, /npm run build/);
});
