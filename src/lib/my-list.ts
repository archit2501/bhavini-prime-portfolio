/** My List: the titles a visitor saves with "+", kept in this browser only. */
export const MY_LIST_KEY = 'bhavini:my-list';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * A Set in the order things were added, so has/add/remove are O(1) and the page can list the
 * newest first. Storage holds it as a JSON array of slugs.
 */
export class MyList {
  private readonly ids: Set<string>;

  constructor(ids: Iterable<string> = []) {
    this.ids = new Set(ids);
  }

  has(id: string): boolean {
    return this.ids.has(id);
  }

  add(id: string): void {
    this.ids.delete(id);
    this.ids.add(id);
  }

  remove(id: string): void {
    this.ids.delete(id);
  }

  /** Adds or removes; true if it is now in the list. */
  toggle(id: string): boolean {
    if (this.ids.has(id)) {
      this.ids.delete(id);
      return false;
    }
    this.ids.add(id);
    return true;
  }

  get size(): number {
    return this.ids.size;
  }

  /** Newest first. O(k). */
  newestFirst(): string[] {
    return [...this.ids].reverse();
  }

  toJSON(): string[] {
    return [...this.ids];
  }
}

/** A stored list, or an empty one if it is missing or not what we wrote. */
export function parseList(raw: string | null): MyList {
  if (!raw) return new MyList();
  try {
    const data: unknown = JSON.parse(raw);
    return new MyList(Array.isArray(data) ? data.filter((v) => typeof v === 'string') : []);
  } catch {
    return new MyList();
  }
}

/** Reads the list; blocked or missing storage reads as empty. */
export function readList(storage: StorageLike | null | undefined): MyList {
  try {
    return parseList(storage?.getItem(MY_LIST_KEY) ?? null);
  } catch {
    return new MyList();
  }
}

/** Saves the list; false when storage is unavailable (private mode, blocked, full). */
export function writeList(storage: StorageLike | null | undefined, list: MyList): boolean {
  try {
    if (!storage) return false;
    storage.setItem(MY_LIST_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

/** The button's name: what pressing it will do. */
export function listButtonLabel(title: string, inList: boolean): string {
  return inList ? `Remove ${title} from My List` : `Add ${title} to My List`;
}

/** The live-region message after a press, noting when the browser won't keep it. */
export function listMessage(title: string, added: boolean, saved: boolean): string {
  const done = added ? `Added ${title} to My List` : `Removed ${title} from My List`;
  return saved ? done : `${done} for this visit; this browser isn't saving it`;
}
