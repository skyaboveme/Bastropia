import { burnBan, burnStatus } from '../data/burnBan';
import { siteUrl } from '../data/site';
import { listAlertSubscriptions, type AlertSubscription } from './alertStore';
import { sendAlertMails, type AlertMail } from './alertMail';
import { getCountyNow, type CountyNow } from './countyNow';
import { sessionKv } from './sessionKv';

const stateKey = 'alertwatch:state';

export type StatusSnapshot = {
  'burn-ban': string;
  schools: string;
  power: string;
  'sh-71': string;
  'us-290': string;
  roads: string;
  namedRoads: Record<string, string>;
};

export type StatusChange = {
  topic: keyof Omit<StatusSnapshot, 'namedRoads'> | 'road';
  road?: string;
  hash: string;
  subject: string;
  text: string;
  href: string;
};

function line(label: string, detail: string) {
  return `${label}|${detail}`.toLowerCase();
}

function closuresFingerprint(now: CountyNow) {
  return now.closures
    .map((item) => `${item.route}|${item.kind}|${item.detail}`)
    .sort()
    .join(';;')
    .toLowerCase();
}

function watchedRoad(now: CountyNow, name: string) {
  const watched = now.roads.find((item) => item.route === name);
  const closure = now.closures.find((item) => item.route === name);
  if (closure) return line(`${closure.kind}`, `${closure.detail}`);
  if (watched) return line(watched.label, watched.detail);
  return 'none';
}

export function buildSnapshot(now: CountyNow): StatusSnapshot {
  const namedRoads: Record<string, string> = {};
  for (const alert of [...now.closures, ...now.others]) {
    const key = alert.route.toLowerCase();
    namedRoads[key] = line(alert.kind, alert.detail);
  }
  return {
    'burn-ban': burnBan.inEffect ? 'in-effect' : 'clear',
    schools: now.schools ? line(now.schools.label, now.schools.detail) : 'none',
    power: now.power ? line(now.power.label, now.power.detail) : 'none',
    'sh-71': watchedRoad(now, 'SH 71'),
    'us-290': watchedRoad(now, 'US 290'),
    roads: closuresFingerprint(now) || 'none',
    namedRoads,
  };
}

function burnCopy(next: string): Pick<StatusChange, 'subject' | 'text' | 'href'> {
  if (next === 'in-effect') {
    return {
      subject: 'Burn ban in effect — Bastrop County',
      text: `The outdoor burning page now shows a burn ban. Masthead status: ${burnStatus}.\n\n${siteUrl}/burn-ban`,
      href: `${siteUrl}/burn-ban`,
    };
  }
  return {
    subject: 'Burn ban lifted — Bastrop County',
    text: `The outdoor burning page no longer lists a burn ban. Masthead status: ${burnStatus}.\n\n${siteUrl}/burn-ban`,
    href: `${siteUrl}/burn-ban`,
  };
}

function schoolsCopy(now: CountyNow): Pick<StatusChange, 'subject' | 'text' | 'href'> {
  const label = now.schools?.label ?? 'Updated';
  const detail = now.schools?.detail ?? 'Check the school page.';
  return {
    subject: `School status: ${label}`,
    text: `${label}. ${detail}\n\n${siteUrl}/weather`,
    href: `${siteUrl}/weather`,
  };
}

function powerCopy(now: CountyNow): Pick<StatusChange, 'subject' | 'text' | 'href'> {
  const label = now.power?.label ?? 'Updated';
  const detail = now.power?.detail ?? 'Bluebonnet outage map.';
  return {
    subject: `Power: ${label}`,
    text: `${label}. ${detail}\n\n${siteUrl}`,
    href: siteUrl,
  };
}

function roadCopy(route: string, fingerprint: string): Pick<StatusChange, 'subject' | 'text' | 'href'> {
  const [label, detail = ''] = fingerprint.split('|');
  const calm = label === 'none listed' || label === 'none' || fingerprint === 'none';
  return {
    subject: calm ? `${route} clear — Bastrop County` : `${route}: ${label}`,
    text: calm
      ? `No active DriveTexas crash or closure listed for ${route}.\n\n${siteUrl}/roads`
      : `${route} — ${label}${detail ? `. ${detail}` : ''}\n\n${siteUrl}/roads`,
    href: `${siteUrl}/roads`,
  };
}

function countyRoadsCopy(now: CountyNow): Pick<StatusChange, 'subject' | 'text' | 'href'> {
  const lineStatus = now.closureLine;
  return {
    subject: `County roads: ${lineStatus.label}`,
    text: `${lineStatus.label}${lineStatus.detail ? ` · ${lineStatus.detail}` : ''}.\n\n${siteUrl}/roads`,
    href: `${siteUrl}/roads`,
  };
}

export function diffSnapshots(prev: StatusSnapshot | null, next: StatusSnapshot, now: CountyNow): StatusChange[] {
  if (!prev) return [];
  const changes: StatusChange[] = [];

  if (prev['burn-ban'] !== next['burn-ban']) {
    const copy = burnCopy(next['burn-ban']);
    changes.push({ topic: 'burn-ban', hash: next['burn-ban'], ...copy });
  }
  if (prev.schools !== next.schools) {
    changes.push({ topic: 'schools', hash: next.schools, ...schoolsCopy(now) });
  }
  if (prev.power !== next.power) {
    changes.push({ topic: 'power', hash: next.power, ...powerCopy(now) });
  }
  if (prev['sh-71'] !== next['sh-71']) {
    changes.push({ topic: 'sh-71', hash: next['sh-71'], ...roadCopy('SH 71', next['sh-71']) });
  }
  if (prev['us-290'] !== next['us-290']) {
    changes.push({ topic: 'us-290', hash: next['us-290'], ...roadCopy('US 290', next['us-290']) });
  }
  if (prev.roads !== next.roads) {
    changes.push({ topic: 'roads', hash: next.roads, ...countyRoadsCopy(now) });
  }

  const roadNames = new Set([...Object.keys(prev.namedRoads), ...Object.keys(next.namedRoads)]);
  for (const name of roadNames) {
    const before = prev.namedRoads[name] ?? 'none';
    const after = next.namedRoads[name] ?? 'none';
    if (before === after) continue;
    changes.push({
      topic: 'road',
      road: name,
      hash: after,
      ...roadCopy(name.toUpperCase(), after),
    });
  }

  return changes;
}

function roadMatch(route: string, wanted: string) {
  const left = route.toLowerCase().replace(/\s+/g, ' ').trim();
  const right = wanted.toLowerCase().replace(/\s+/g, ' ').trim();
  return left === right || left.includes(right) || right.includes(left);
}

function subscribersFor(change: StatusChange, people: AlertSubscription[]) {
  if (change.topic === 'road') {
    const needle = change.road ?? '';
    return people.filter((person) => person.topic === 'road' && person.road && roadMatch(needle, person.road));
  }
  return people.filter((person) => person.topic === change.topic);
}

async function alreadySent(topicKey: string, hash: string) {
  const kv = sessionKv();
  if (!kv) return false;
  const key = `alertwatch:sent:${topicKey}:${hash.slice(0, 80)}`;
  const existing = await kv.get(key);
  return Boolean(existing);
}

async function markSent(topicKey: string, hash: string) {
  const kv = sessionKv();
  if (!kv) return;
  const key = `alertwatch:sent:${topicKey}:${hash.slice(0, 80)}`;
  await kv.put(key, new Date().toISOString(), { expirationTtl: 60 * 60 * 24 * 14 });
}

export async function runAlertWatch() {
  const kv = sessionKv();
  if (!kv) return { ok: false as const, reason: 'no-kv' };

  const now = await getCountyNow();
  const next = buildSnapshot(now);
  const rawPrev = await kv.get(stateKey, 'json');
  const prev = rawPrev && typeof rawPrev === 'object' ? (rawPrev as StatusSnapshot) : null;

  await kv.put(stateKey, JSON.stringify(next));

  if (!prev) {
    return { ok: true as const, seeded: true, mailed: 0, changes: 0 };
  }

  const changes = diffSnapshots(prev, next, now);
  if (!changes.length) return { ok: true as const, seeded: false, mailed: 0, changes: 0 };

  const people = await listAlertSubscriptions();
  const messages: AlertMail[] = [];

  for (const change of changes) {
    const topicKey = change.topic === 'road' ? `road:${change.road ?? ''}` : change.topic;
    if (await alreadySent(topicKey, change.hash)) continue;
    const targets = subscribersFor(change, people);
    for (const person of targets) {
      messages.push({
        to: person.email,
        subject: change.subject,
        text: change.text,
      });
    }
    await markSent(topicKey, change.hash);
  }

  const result = await sendAlertMails(messages);
  return {
    ok: true as const,
    seeded: false,
    mailed: result.sent,
    skipped: result.skipped,
    changes: changes.length,
  };
}
