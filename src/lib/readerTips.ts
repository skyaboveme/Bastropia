import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type ReaderTip = {
  id: string;
  createdAt: string;
  place: string;
  body: string;
  photoUrl?: string;
  credit?: string;
};

const tipsFile = path.join(process.cwd(), 'data', 'readerTips.json');

export async function listPublishedTips() {
  try {
    const tips = JSON.parse(await readFile(tipsFile, 'utf8')) as ReaderTip[];
    return tips.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export async function publishTip(tip: ReaderTip) {
  const tips = await listPublishedTips();
  const next = [tip, ...tips.filter((item) => item.id !== tip.id)];
  await writeFile(tipsFile, JSON.stringify(next, null, 2));
  return tip;
}
