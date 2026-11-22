import { compareDirectory, directoryEntries, directoryNameKey, type DirectoryEntry } from '../data/directory';
import { listLiveBusinesses, listSuppressedDirectoryNames, toDirectoryEntry } from './businessDb';

/**
 * Live D1 rows win. The chamber JSON fills names D1 has never stored.
 * status='hidden' and in_county=0 are suppressed, so a hide stays hidden
 * even when the same name is still in chamberDirectory.json.
 * When D1 is not bound or the query fails, the JSON snapshot is the directory.
 */
export async function loadDirectoryEntries(): Promise<DirectoryEntry[]> {
  const partners = directoryEntries.filter((entry) => entry.source === 'partner');
  const snapshot = directoryEntries.filter((entry) => entry.source !== 'partner');
  try {
    const suppressed = await listSuppressedDirectoryNames();
    if (!suppressed) return [...partners, ...snapshot].sort(compareDirectory);
    const partnerNames = new Set(partners.map((entry) => directoryNameKey(entry.name)));
    const listed = (await listLiveBusinesses())
      .map(toDirectoryEntry)
      .filter((entry) => !partnerNames.has(directoryNameKey(entry.name)));
    const taken = new Set([...listed, ...partners].map((entry) => directoryNameKey(entry.name)));
    for (const name of suppressed) taken.add(directoryNameKey(name));
    const rest = snapshot.filter((entry) => !taken.has(directoryNameKey(entry.name)));
    return [...partners, ...listed, ...rest].sort(compareDirectory);
  } catch {
    return [...partners, ...snapshot].sort(compareDirectory);
  }
}
