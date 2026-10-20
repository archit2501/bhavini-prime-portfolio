import { RESUME_PATH } from './contact';

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

/** Set when the picker has been answered or dismissed this session, so it asks only once. */
export const PICKER_KEY = 'bhavini:picker';

/**
 * What each visitor sees first on the home page, after the hero. Rows a profile doesn't list keep
 * their page order after the ones it does.
 */
const ROW_PRIORITY: Record<ProfileId, string[]> = {
  recruiter: ['experience', 'top10', 'continue', 'education', 'certifications', 'skills'],
  founder: ['top10', 'continue', 'experience', 'skills', 'certifications', 'education'],
  collaborator: ['skills', 'experience', 'continue', 'top10', 'certifications', 'education'],
  browsing: [],
};

/** The home rows in this profile's order; a stable sort, O(r log r). */
export function orderRows(rowIds: string[], profile: ProfileId | null): string[] {
  const priority = profile ? ROW_PRIORITY[profile] : [];
  const rank = (id: string) => {
    const i = priority.indexOf(id);
    return i === -1 ? priority.length : i;
  };
  return rowIds
    .map((id, index) => ({ id, index }))
    .sort((a, b) => rank(a.id) - rank(b.id) || a.index - b.index)
    .map(({ id }) => id);
}

/** The call to action after "Open to roles" in the hero, per profile. */
export interface ProfileCta {
  label: string;
  /** A site path, before withBase. */
  href: string;
  download?: boolean;
}

export function profileCta(profile: ProfileId | null): ProfileCta | undefined {
  switch (profile) {
    case 'recruiter':
      return { label: 'Get her resume', href: RESUME_PATH, download: true };
    case 'founder':
      return { label: 'Start a conversation', href: '/contact/' };
    case 'collaborator':
      return { label: 'Say hello', href: '/contact/' };
    default:
      return undefined;
  }
}
