import {
  listButtonLabel,
  listMessage,
  MY_LIST_KEY,
  readList,
  writeList,
  type MyList,
} from '../lib/my-list';

/**
 * Every "+" on the site ([data-my-list] buttons: hero, hover card, detail page) toggles the
 * title in My List, shows a check when it's in, and says what happened in a polite status.
 * One delegated listener, so buttons added or re-pointed later (the hover card) just work.
 */
const storage = (() => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
})();
let list: MyList = readList(storage);
let persistent = true;
const listeners = new Set<(list: MyList) => void>();

/** Brings one button in line with the list: its pressed state and its name. O(1). */
export function syncButton(button: HTMLElement): void {
  const id = button.dataset.myList;
  if (!id) return;
  const inList = list.has(id);
  const label = listButtonLabel(button.dataset.myListTitle ?? id, inList);
  button.setAttribute('aria-pressed', String(inList));
  if (button.hasAttribute('aria-label')) button.setAttribute('aria-label', label);
  else {
    const text = button.querySelector('.visually-hidden');
    if (text) text.textContent = label;
  }
}

function syncAll(): void {
  document.querySelectorAll<HTMLElement>('[data-my-list]').forEach(syncButton);
  listeners.forEach((listener) => listener(list));
}

/** Calls back now and on every change (the My List page uses it to show its grid). */
export function onListChange(listener: (list: MyList) => void): void {
  listeners.add(listener);
  listener(list);
}

document.addEventListener('click', (e) => {
  const button = (e.target as Element | null)?.closest<HTMLElement>('[data-my-list]');
  const id = button?.dataset.myList;
  if (!button || !id) return;
  // Pick up changes from other tabs first, unless storage has already let us down.
  if (persistent) list = readList(storage);
  const added = list.toggle(id);
  persistent = writeList(storage, list);
  syncAll();
  const status = document.querySelector('[data-my-list-status]');
  if (status) status.textContent = listMessage(button.dataset.myListTitle ?? id, added, persistent);
});

// Another tab changed the list.
window.addEventListener('storage', (e) => {
  if (e.key !== MY_LIST_KEY) return;
  list = readList(storage);
  syncAll();
});

syncAll();
