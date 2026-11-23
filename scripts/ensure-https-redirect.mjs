import { execFileSync } from 'node:child_process';

/**
 * Point HTTP and www at https://bastropia.com from the zone, using the same
 * Cloudflare token that deploys the Worker. The Worker does this too. The
 * zone rule runs first, so a plain HTTP request never has to enter the Worker.
 *
 * Always Use HTTPS keeps the original host (http://www → https://www). That
 * hides the apex redirect, so once the rule is in place this turns that
 * setting off and turns it back on if the live check fails.
 */
const ZONE_NAME = 'bastropia.com';
const APEX = 'https://bastropia.com';
const RULE_REF = 'bastropia-https-apex';
const API = 'https://api.cloudflare.com/client/v4';

const token = process.env.CLOUDFLARE_API_TOKEN || '';
if (!token) {
  console.log('CLOUDFLARE_API_TOKEN is unset. The Worker redirect still applies.');
  process.exit(0);
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  return { response, body };
}

function rule() {
  return {
    ref: RULE_REF,
    description: 'Send HTTP and www to the HTTPS apex, keeping the path and query.',
    expression:
      '(http.host in {"bastropia.com" "www.bastropia.com"}) and (http.request.scheme eq "http" or http.host eq "www.bastropia.com") and not starts_with(http.request.uri.path, "/.well-known/")',
    action: 'redirect',
    enabled: true,
    action_parameters: {
      from_value: {
        status_code: 301,
        preserve_query_string: true,
        target_url: {
          expression: 'concat("https://bastropia.com", http.request.uri.path)',
        },
      },
    },
  };
}

function writableRule(existing) {
  const next = {
    action: existing.action,
    expression: existing.expression,
    enabled: existing.enabled !== false,
  };
  if (existing.ref) next.ref = existing.ref;
  if (existing.id) next.id = existing.id;
  if (existing.description) next.description = existing.description;
  if (existing.action_parameters) next.action_parameters = existing.action_parameters;
  return next;
}

async function zoneId() {
  const { response, body } = await api(`/zones?name=${ZONE_NAME}`);
  if (!response.ok || !body?.success) {
    console.log(`Zone lookup failed (${response.status}). The Worker redirect still applies.`);
    console.log(JSON.stringify(body?.errors || body));
    return null;
  }
  const id = body.result?.[0]?.id;
  if (!id) console.log(`No zone named ${ZONE_NAME}. The Worker redirect still applies.`);
  return id || null;
}

async function readAlwaysHttps(id) {
  const { response, body } = await api(`/zones/${id}/settings/always_use_https`);
  if (!response.ok) return { readable: false, value: '', status: response.status, errors: body?.errors };
  return { readable: true, value: body?.result?.value || '', status: response.status };
}

async function writeAlwaysHttps(id, value) {
  const { response, body } = await api(`/zones/${id}/settings/always_use_https`, {
    method: 'PATCH',
    body: JSON.stringify({ value }),
  });
  if (!response.ok || body?.success === false) {
    console.log(`Could not set Always Use HTTPS to ${value} (${response.status}).`);
    console.log(JSON.stringify(body?.errors || body));
    return false;
  }
  console.log(`Always Use HTTPS is ${value}.`);
  return true;
}

async function installRule(id) {
  const ours = rule();
  const entry = await api(`/zones/${id}/rulesets/phases/http_request_dynamic_redirect/entrypoint`);
  if (entry.response.status === 404) {
    const created = await api(`/zones/${id}/rulesets`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Redirect rules ruleset',
        kind: 'zone',
        phase: 'http_request_dynamic_redirect',
        rules: [ours],
      }),
    });
    if (!created.response.ok || created.body?.success === false) {
      console.log(`Could not create the redirect rule (${created.response.status}).`);
      console.log(JSON.stringify(created.body?.errors || created.body));
      return false;
    }
    console.log('Created the HTTPS apex redirect rule.');
    return true;
  }
  if (!entry.response.ok || entry.body?.success === false) {
    console.log(`Could not read redirect rules (${entry.response.status}).`);
    console.log(JSON.stringify(entry.body?.errors || entry.body));
    return false;
  }
  const ruleset = entry.body.result;
  const previous = (ruleset.rules || []).find((item) => item.ref === RULE_REF);
  if (previous?.id) ours.id = previous.id;
  const others = (ruleset.rules || []).filter((item) => item.ref !== RULE_REF && item.id !== previous?.id);
  const updated = await api(`/zones/${id}/rulesets/${ruleset.id}`, {
    method: 'PUT',
    body: JSON.stringify({ rules: [ours, ...others.map(writableRule)] }),
  });
  if (!updated.response.ok || updated.body?.success === false) {
    console.log(`Could not update the redirect rule (${updated.response.status}).`);
    console.log(JSON.stringify(updated.body?.errors || updated.body));
    return false;
  }
  console.log('Updated the HTTPS apex redirect rule.');
  return true;
}

function curlHead(url) {
  try {
    const output = execFileSync('curl', ['-sI', '--http1.1', '--max-time', '20', url], { encoding: 'utf8' });
    const status = Number(output.match(/^HTTP\/\S+\s+(\d+)/m)?.[1] || 0);
    const location = output.match(/^location:\s*(.*)$/im)?.[1]?.trim() || '';
    return { status, location };
  } catch (error) {
    const output = `${error.stdout || ''}`;
    const status = Number(output.match(/^HTTP\/\S+\s+(\d+)/m)?.[1] || 0);
    const location = output.match(/^location:\s*(.*)$/im)?.[1]?.trim() || '';
    return { status, location, error: error instanceof Error ? error.message : String(error) };
  }
}

async function liveOk() {
  const checks = [
    ['http://bastropia.com/', `${APEX}/`],
    ['http://www.bastropia.com/', `${APEX}/`],
    ['http://bastropia.com/news', `${APEX}/news`],
    ['http://bastropia.com/events?x=1', `${APEX}/events?x=1`],
  ];
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const results = [];
    let good = true;
    for (const [url, location] of checks) {
      try {
        const result = await curlHead(url);
        results.push(`${result.status} ${url} -> ${result.location}${result.error ? ` (${result.error})` : ''}`);
        if (result.status !== 301 || result.location !== location) good = false;
      } catch (error) {
        results.push(`error ${url} ${error instanceof Error ? error.message : error}`);
        good = false;
      }
    }
    console.log(`Live check ${attempt}:\n${results.join('\n')}`);
    if (good) return true;
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  return false;
}

const id = await zoneId();
if (!id) process.exit(0);

const before = await readAlwaysHttps(id);
console.log(
  before.readable
    ? `Always Use HTTPS is currently ${before.value || 'unset'}.`
    : `Always Use HTTPS is not readable (${before.status}).`,
);

const installed = await installRule(id);
if (!installed) {
  if (before.readable && before.value !== 'on') await writeAlwaysHttps(id, 'on');
  process.exit(0);
}

if (before.readable && before.value === 'on') {
  const turnedOff = await writeAlwaysHttps(id, 'off');
  if (turnedOff) {
    const ok = await liveOk();
    if (!ok) {
      console.log('Live HTTP redirect did not land on the apex. Restoring Always Use HTTPS.');
      await writeAlwaysHttps(id, 'on');
    }
  }
} else if (before.readable && before.value !== 'on') {
  const ok = await liveOk();
  if (!ok) await writeAlwaysHttps(id, 'on');
}
