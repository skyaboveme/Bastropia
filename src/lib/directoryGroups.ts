import groupsFile from '../data/directoryCategoryGroups.json' with { type: 'json' };
import { normalizeCategoryLabel, publicCategoryBySlug, publicCategoryFor } from '../data/directoryCategories.ts';

export type DirectoryGroup = (typeof groupsFile.groups)[number];

type LabelInfo = { display: string; group: string; subgroup: string; liveCount?: number };

const labels = groupsFile.labels as Record<string, LabelInfo>;
const byId = new Map(groupsFile.groups.map((group) => [group.id, group]));

/** Old public slugs still in shared links. */
const legacyGroup: Record<string, string> = {
  'home-services': 'home-repair',
  'health-wellness': 'health',
  'shops-retail': 'shopping',
  'beauty-personal-care': 'beauty-fitness',
  'recreation-outdoors': 'things-to-do',
  'community-nonprofit': 'community',
  lodging: 'stay',
  'construction-trades': 'builders',
  'industrial-utilities': 'business',
  'education-childcare': 'community',
  agriculture: 'shopping',
};

export function directoryGroupList() {
  return [...groupsFile.groups].sort((a, b) => a.order - b.order);
}

export function directoryGridGroups() {
  return directoryGroupList().filter((group) => group.grid);
}

export function directoryMoreGroups() {
  return directoryGroupList().filter((group) => !group.grid);
}

export function directoryGroupById(id: string) {
  return byId.get(id) || legacyGroup[id] ? byId.get(legacyGroup[id] || id) : undefined;
}

export function directoryLabelInfo(category: string): LabelInfo {
  const key = normalizeCategoryLabel(category || '');
  return labels[key] || { display: category || 'Business', group: 'business', subgroup: '' };
}

export function categoryMatchesGroup(category: string, groupId: string, subgroup = '') {
  const info = directoryLabelInfo(category);
  if (subgroup && info.subgroup.toLowerCase() !== subgroup.toLowerCase()) return false;
  if (!groupId) return true;
  if (info.group === groupId) return true;
  const legacy = legacyGroup[groupId];
  if (legacy && info.group === legacy) return true;
  if (publicCategoryBySlug(groupId)) return publicCategoryFor(category).slug === groupId;
  return normalizeCategoryLabel(category) === normalizeCategoryLabel(groupId);
}

export function subgroupsForGroup(groupId: string) {
  const found = new Set<string>();
  for (const info of Object.values(labels)) {
    if (info.group === groupId && info.subgroup) found.add(info.subgroup);
  }
  return [...found].sort((a, b) => a.localeCompare(b));
}

const legacyNames: Record<string, string> = {
  'professional-services': 'Professional services',
};

/** Short name used in the grid and in headings, so both say "Home Repair". */
export function groupShort(groupId: string) {
  if (!groupId) return '';
  const group = directoryGroupById(groupId);
  if (group) return group.short || group.label;
  if (legacyNames[groupId]) return legacyNames[groupId];
  const pub = publicCategoryBySlug(groupId);
  if (pub) return pub.label;
  return groupId.replace(/-/g, ' ');
}

export function groupLabel(groupId: string) {
  return groupShort(groupId);
}
