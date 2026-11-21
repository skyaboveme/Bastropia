/**
 * Squash-merge a content-only pull request, then start Deploy.
 *
 * Runs from the default-branch checkout in auto-merge-content.yml.
 * It never checks out the pull request. The file list comes from the API.
 */
import { pathToFileURL } from 'node:url';
import {
  COMMENT_MARKER,
  classifyFiles,
  isForkPullRequest,
  mergeDecision,
  renderComment,
  shouldDispatchExisting,
  shouldKeepExistingComment,
} from './content-pr-allowlist.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function errorText(res) {
  const message = res.data && typeof res.data.message === 'string' ? res.data.message : `HTTP ${res.status}`;
  return message.replace(/\s+/g, ' ').slice(0, 400);
}

async function gh(pathname, { method = 'GET', body } = {}) {
  const response = await fetch(`https://api.github.com${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'bastropia-content-auto-merge',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text.slice(0, 500) };
    }
  }
  return { ok: response.ok, status: response.status, data };
}

async function getAll(pathname) {
  const items = [];
  for (let page = 1; page <= 31; page += 1) {
    const join = pathname.includes('?') ? '&' : '?';
    const res = await gh(`${pathname}${join}per_page=100&page=${page}`);
    if (!res.ok) throw new Error(`GET ${pathname} failed: ${errorText(res)}`);
    if (!Array.isArray(res.data)) throw new Error(`GET ${pathname} did not return a list`);
    items.push(...res.data);
    if (res.data.length < 100) return { items, truncated: false };
  }
  return { items, truncated: true };
}

async function findPullRequest(repo, sha, hint) {
  if (hint && /^\d+$/.test(String(hint))) {
    const res = await gh(`/repos/${repo}/pulls/${hint}`);
    if (res.ok && res.data?.head?.sha === sha) return res.data;
  }
  const { items } = await getAll(`/repos/${repo}/commits/${sha}/pulls`);
  const matches = items.filter((pullRequest) => pullRequest.head?.sha === sha);
  const found = matches.find((pullRequest) => pullRequest.state === 'open') || matches[0];
  if (found) return found;
  const headRepo = process.env.HEAD_REPO || '';
  const headBranch = process.env.HEAD_BRANCH || '';
  const owner = headRepo.split('/')[0];
  if (!owner || !headBranch) return null;
  const listed = await getAll(`/repos/${repo}/pulls?state=all&head=${encodeURIComponent(`${owner}:${headBranch}`)}`);
  return listed.items.find((pullRequest) => pullRequest.head?.sha === sha) || null;
}

function commitTitle(pullRequest) {
  const suffix = ` (#${pullRequest.number})`;
  const title = (pullRequest.title || 'Content update').replace(/\s+/g, ' ').trim() || 'Content update';
  if (title.includes(`#${pullRequest.number}`)) return title.slice(0, 250);
  return `${title.slice(0, 250 - suffix.length)}${suffix}`;
}

async function branchContains(repo, branch, sha) {
  const head = await gh(`/repos/${repo}/commits/${encodeURIComponent(branch)}`);
  if (!head.ok) return null;
  if (head.data.sha === sha) return head.data.sha;
  const compared = await gh(`/repos/${repo}/compare/${sha}...${head.data.sha}`);
  if (compared.ok && (compared.data.status === 'identical' || compared.data.status === 'ahead')) {
    return head.data.sha;
  }
  return null;
}

async function resolveDeploySha(repo, branch, mergeSha) {
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const found = await branchContains(repo, branch, mergeSha);
    if (found) return found;
    await sleep(2000);
  }
  return null;
}

async function deployCovered(repo, sha) {
  const res = await gh(`/repos/${repo}/actions/workflows/deploy.yml/runs?head_sha=${sha}&per_page=20`);
  if (!res.ok) return false;
  return (res.data.workflow_runs || []).some((run) => {
    if (run.head_sha !== sha) return false;
    if (run.conclusion === 'success') return true;
    return ['queued', 'in_progress', 'waiting', 'pending', 'requested', 'action_required'].includes(run.status) && !run.conclusion;
  });
}

async function dispatchDeploy(repo, branch, sha) {
  if (await deployCovered(repo, sha)) return { ok: true, already: true };
  const res = await gh(`/repos/${repo}/actions/workflows/deploy.yml/dispatches`, {
    method: 'POST',
    body: { ref: branch },
  });
  if (res.ok) return { ok: true, already: false };
  return { ok: false, error: errorText(res) };
}

async function upsertComment(repo, number, body) {
  const { items } = await getAll(`/repos/${repo}/issues/${number}/comments`);
  const existing = items.find((comment) => typeof comment.body === 'string' && comment.body.includes(COMMENT_MARKER));
  if (existing && shouldKeepExistingComment(existing.body, body)) {
    console.log(`Keeping the merged comment on #${number}.`);
    return;
  }
  const path = existing
    ? `/repos/${repo}/issues/comments/${existing.id}`
    : `/repos/${repo}/issues/${number}/comments`;
  const res = await gh(path, { method: existing ? 'PATCH' : 'POST', body: { body } });
  if (!res.ok) throw new Error(`Updating the pull request comment failed: ${errorText(res)}`);
}

function fileCount(classification) {
  return classification.allowed.length + classification.blocked.length;
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.REPO;
  const defaultBranch = process.env.DEFAULT_BRANCH || 'main';
  const buildHeadSha = process.env.BUILD_HEAD_SHA;
  const buildConclusion = process.env.BUILD_CONCLUSION || '';
  const buildUrl = process.env.BUILD_URL || '';
  const hint = process.env.BUILD_PR_NUMBER || '';
  if (!token || !repo || !buildHeadSha) {
    throw new Error('GITHUB_TOKEN, REPO, and BUILD_HEAD_SHA are required.');
  }
  if (!/^[^/\s]+\/[^/\s]+$/.test(repo)) throw new Error('REPO must look like owner/name.');

  const pullRequest = await findPullRequest(repo, buildHeadSha, hint);
  if (!pullRequest) {
    console.log(`No pull request found for ${buildHeadSha}.`);
    return;
  }

  const { items, truncated } = await getAll(`/repos/${repo}/pulls/${pullRequest.number}/files`);
  const classification = classifyFiles(
    items.map((file) => ({
      filename: file.filename,
      status: file.status,
      previous_filename: file.previous_filename,
    })),
    { truncated },
  );
  const fork = isForkPullRequest(pullRequest, repo);
  const headMatches = pullRequest.head?.sha === buildHeadSha;
  const decision = mergeDecision({
    classification,
    fork,
    draft: pullRequest.draft === true,
    baseBranch: pullRequest.base?.ref,
    defaultBranch,
    headMatches,
    state: pullRequest.state,
    merged: pullRequest.merged === true,
    buildConclusion,
  });
  const commentBase = {
    buildConclusion,
    buildUrl,
    headSha: buildHeadSha,
  };
  console.log(
    `#${pullRequest.number} eligible=${classification.eligible} fork=${fork} build=${buildConclusion} merge=${decision.merge} files=${fileCount(classification)}`,
  );

  if (pullRequest.merged) {
    const dispatch = shouldDispatchExisting({
      mergedBy: pullRequest.merged_by?.login,
      deployCovered: false,
      classification,
      fork,
      buildConclusion,
      headMatches,
    });
    if (!dispatch) {
      await upsertComment(
        repo,
        pullRequest.number,
        renderComment({
          ...commentBase,
          outcome: 'skipped',
          reasons: ['The pull request is already merged.'],
        }),
      );
      return;
    }
    const deploySha = await resolveDeploySha(repo, defaultBranch, pullRequest.merge_commit_sha);
    if (!deploySha) {
      await upsertComment(
        repo,
        pullRequest.number,
        renderComment({
          ...commentBase,
          outcome: 'deploy-failed',
          summary: `The Actions bot already squash-merged this pull request as \`${pullRequest.merge_commit_sha}\`. \`${defaultBranch}\` did not show that commit, so deploy was not started.`,
        }),
      );
      process.exitCode = 1;
      return;
    }
    const deployed = await dispatchDeploy(repo, defaultBranch, deploySha);
    await upsertComment(
      repo,
      pullRequest.number,
      renderComment({
        ...commentBase,
        outcome: deployed.ok ? 'already-merged' : 'deploy-failed',
        summary: deployed.ok
          ? `The Actions bot already squash-merged this pull request. Deploy ${deployed.already ? 'is already running or finished' : 'was started'} for \`${defaultBranch}\` at or after \`${deploySha}\`.`
          : `The Actions bot already squash-merged this pull request as \`${pullRequest.merge_commit_sha}\`. Deploy did not start: ${deployed.error}`,
      }),
    );
    if (!deployed.ok) process.exitCode = 1;
    return;
  }

  if (!decision.merge) {
    const allowed = classification.allowed.length;
    await upsertComment(
      repo,
      pullRequest.number,
      renderComment({
        ...commentBase,
        outcome: 'skipped',
        summary: allowed && classification.blocked.length
          ? `${allowed} changed ${allowed === 1 ? 'file is' : 'files are'} on the content allowlist.`
          : '',
        reasons: decision.reasons,
      }),
    );
    return;
  }

  const merged = await gh(`/repos/${repo}/pulls/${pullRequest.number}/merge`, {
    method: 'PUT',
    body: {
      merge_method: 'squash',
      sha: pullRequest.head.sha,
      commit_title: commitTitle(pullRequest),
      commit_message: 'Auto-merged by the content allowlist after the pull request build passed.',
    },
  });
  if (!merged.ok || !merged.data?.merged || !merged.data.sha) {
    const again = await gh(`/repos/${repo}/pulls/${pullRequest.number}`);
    if (again.ok && again.data?.merged && again.data.merged_by?.login === 'github-actions[bot]') {
      pullRequest.merged = true;
      pullRequest.merge_commit_sha = again.data.merge_commit_sha;
      pullRequest.merged_by = again.data.merged_by;
    } else if (again.ok && again.data?.merged) {
      await upsertComment(
        repo,
        pullRequest.number,
        renderComment({
          ...commentBase,
          outcome: 'skipped',
          reasons: ['The pull request was merged by someone else while the build was finishing.'],
        }),
      );
      return;
    } else {
      await upsertComment(
        repo,
        pullRequest.number,
        renderComment({
          ...commentBase,
          outcome: 'merge-failed',
          summary: `${fileCount(classification)} changed files are on the content allowlist and the build passed.`,
          reasons: [`GitHub rejected the squash merge (${merged.status}): ${errorText(merged)}`],
        }),
      );
      process.exitCode = 1;
      return;
    }
  }

  const mergeSha = merged.data?.sha || pullRequest.merge_commit_sha;
  const deploySha = await resolveDeploySha(repo, defaultBranch, mergeSha);
  if (!deploySha) {
    await upsertComment(
      repo,
      pullRequest.number,
      renderComment({
        ...commentBase,
        outcome: 'deploy-failed',
        summary: `Squash-merged \`${buildHeadSha}\` as \`${mergeSha}\`. \`${defaultBranch}\` did not show that commit, so deploy was not started.`,
      }),
    );
    process.exitCode = 1;
    return;
  }
  const deployed = await dispatchDeploy(repo, defaultBranch, deploySha);
  const fileTotal = fileCount(classification);
  await upsertComment(
    repo,
    pullRequest.number,
    renderComment({
      ...commentBase,
      outcome: deployed.ok ? 'merged' : 'deploy-failed',
      summary: deployed.ok
        ? `Squash-merged \`${buildHeadSha}\` as \`${mergeSha}\`. ${fileTotal} changed ${fileTotal === 1 ? 'file is' : 'files are'} on the content allowlist. Deploy ${deployed.already ? 'is already running or finished' : 'was started'} for \`${defaultBranch}\` by dispatching the Deploy workflow. A merge made with the Actions token does not start the push trigger, so this dispatch is what publishes the site.`
        : `Squash-merged \`${buildHeadSha}\` as \`${mergeSha}\`. Deploy did not start: ${deployed.error}`,
    }),
  );
  if (!deployed.ok) process.exitCode = 1;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
