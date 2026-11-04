export const alertTopics = [
  { id: 'burn-ban', label: 'Burn ban', detail: 'When the county order flips.', tagId: 25416039 },
  { id: 'schools', label: 'School status', detail: 'A closing or a delay at Bastrop, Elgin, Smithville, or McDade ISD.', tagId: 25416040 },
  { id: 'power', label: 'Power', detail: 'When Bluebonnet reports outages, and when the map is clear again.', tagId: 25416041 },
  { id: 'sh-71', label: 'SH 71', detail: 'A closure or a crash on SH 71.', tagId: 25416042 },
  { id: 'us-290', label: 'US 290', detail: 'A closure or a crash on US 290.', tagId: 25416043 },
  { id: 'roads', label: 'County roads', detail: 'A closure or a crash on any road DriveTexas files in the county.', tagId: 25416044 },
] as const;

export type AlertTopicId = (typeof alertTopics)[number]['id'];

export function alertTopic(id: string) {
  return alertTopics.find((topic) => topic.id === id);
}
