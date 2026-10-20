import { describe, expect, it } from 'vitest';
import {
  avatarBackground,
  PROFILE_KEY,
  PROFILES,
  profileById,
  readProfile,
  writeProfile,
} from './profiles';

function memory(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
    clear: () => data.clear(),
    key: () => null,
    length: 0,
  };
}

const broken = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
};

describe('profiles', () => {
  it('offers four visitor profiles', () => {
    expect(PROFILES.map((p) => p.name)).toEqual([
      'Recruiter',
      'Founder',
      'Collaborator',
      'Just browsing',
    ]);
    expect(profileById('founder')?.name).toBe('Founder');
    expect(profileById('admin')).toBeUndefined();
    expect(profileById(null)).toBeUndefined();
  });

  it('round-trips through storage', () => {
    const s = memory();
    expect(readProfile(s)).toBeNull();
    expect(writeProfile(s, 'collaborator')).toBe(true);
    expect(s.getItem(PROFILE_KEY)).toBe('collaborator');
    expect(readProfile(s)).toBe('collaborator');
  });

  it('ignores unknown saved values', () => {
    const s = memory();
    s.setItem(PROFILE_KEY, 'admin');
    expect(readProfile(s)).toBeNull();
  });

  it('survives missing or blocked storage', () => {
    expect(readProfile(null)).toBeNull();
    expect(readProfile(broken)).toBeNull();
    expect(writeProfile(undefined, 'founder')).toBe(false);
    expect(writeProfile(broken, 'founder')).toBe(false);
  });

  it('paints avatars with each profile gradient', () => {
    expect(avatarBackground(PROFILES[0])).toBe('linear-gradient(135deg, #1a98ff, #0b3a8c)');
  });
});
