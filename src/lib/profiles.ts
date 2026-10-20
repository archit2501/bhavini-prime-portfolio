/**
 * Visitor profiles for the "Who's visiting?" picker (task 3.4.2) and the avatar menu, in the
 * place of Prime's viewer profiles. The choice lasts for the browser session.
 */
export const PROFILES = [
  { id: 'recruiter', name: 'Recruiter', colors: ['#1a98ff', '#0b3a8c'] },
  { id: 'founder', name: 'Founder', colors: ['#ff8a00', '#b3261e'] },
  { id: 'collaborator', name: 'Collaborator', colors: ['#2bb3a3', '#0e5a3a'] },
  { id: 'browsing', name: 'Just browsing', colors: ['#9b5cff', '#3b1d7a'] },
] as const;

export type ProfileId = (typeof PROFILES)[number]['id'];
export type Profile = (typeof PROFILES)[number];

export const PROFILE_KEY = 'bhavini:profile';

export function profileById(id: string | null | undefined): Profile | undefined {
  return PROFILES.find((p) => p.id === id);
}

/** The saved profile, or null when none is saved or storage is unavailable (private mode). */
export function readProfile(
  storage: Pick<Storage, 'getItem'> | null | undefined,
): ProfileId | null {
  try {
    return profileById(storage?.getItem(PROFILE_KEY))?.id ?? null;
  } catch {
    return null;
  }
}

/** Saves the choice; returns false when storage refuses (the page still works without it). */
export function writeProfile(
  storage: Pick<Storage, 'setItem'> | null | undefined,
  id: ProfileId,
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(PROFILE_KEY, id);
    return true;
  } catch {
    return false;
  }
}

/** CSS background for a profile's avatar circle. */
export function avatarBackground(profile: Profile): string {
  return `linear-gradient(135deg, ${profile.colors[0]}, ${profile.colors[1]})`;
}
