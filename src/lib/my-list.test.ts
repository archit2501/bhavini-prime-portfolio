import { describe, expect, it } from 'vitest';
import {
  listButtonLabel,
  listMessage,
  MY_LIST_KEY,
  MyList,
  parseList,
  readList,
  writeList,
  type StorageLike,
} from './my-list';

const memory = (
  initial: Record<string, string> = {},
): StorageLike & { data: Record<string, string> } => {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v;
    },
  };
};

const blocked: StorageLike = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
};

describe('MyList', () => {
  it('adds, removes and toggles in O(1), newest first', () => {
    const list = new MyList(['a']);
    list.add('b');
    expect(list.has('b')).toBe(true);
    expect(list.toggle('c')).toBe(true);
    expect(list.toggle('a')).toBe(false);
    expect(list.newestFirst()).toEqual(['c', 'b']);
    list.remove('b');
    expect(list.size).toBe(1);
    // Adding again moves it to the front.
    list.add('x');
    list.add('c');
    expect(list.newestFirst()).toEqual(['c', 'x']);
    expect(JSON.stringify(list)).toBe('["x","c"]');
  });
});

describe('storage', () => {
  it('round-trips through storage', () => {
    const store = memory();
    expect(writeList(store, new MyList(['f1jobs', 'clinical']))).toBe(true);
    expect(store.data[MY_LIST_KEY]).toBe('["f1jobs","clinical"]');
    expect(readList(store).newestFirst()).toEqual(['clinical', 'f1jobs']);
  });

  it('reads anything unexpected as an empty list', () => {
    expect(parseList(null).size).toBe(0);
    expect(parseList('not json').size).toBe(0);
    expect(parseList('{"a":1}').size).toBe(0);
    expect(parseList('["a", 2, null, "b", "a"]').newestFirst()).toEqual(['b', 'a']);
    expect(readList(memory()).size).toBe(0);
  });

  it('survives storage that is missing or blocked', () => {
    expect(readList(undefined).size).toBe(0);
    expect(readList(blocked).size).toBe(0);
    expect(writeList(null, new MyList())).toBe(false);
    expect(writeList(blocked, new MyList(['a']))).toBe(false);
  });
});

describe('labels', () => {
  it('names the button by what it will do', () => {
    expect(listButtonLabel('Vastra Kala', false)).toBe('Add Vastra Kala to My List');
    expect(listButtonLabel('Vastra Kala', true)).toBe('Remove Vastra Kala from My List');
  });

  it('confirms each press, and says when it will not last', () => {
    expect(listMessage('F1Jobs.io', true, true)).toBe('Added F1Jobs.io to My List');
    expect(listMessage('F1Jobs.io', false, true)).toBe('Removed F1Jobs.io from My List');
    expect(listMessage('F1Jobs.io', true, false)).toBe(
      "Added F1Jobs.io to My List for this visit; this browser isn't saving it",
    );
  });
});
