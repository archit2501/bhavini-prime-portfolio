import { resultsLabel, search, type SearchEntry } from '../lib/search';
import { withBase } from '../lib/url';

/** Typing settles for this long before the results update. */
const DEBOUNCE_MS = 120;

let indexPromise: Promise<SearchEntry[]> | undefined;

/** /search-index.json, fetched once per page and only when someone searches. */
export function loadIndex(): Promise<SearchEntry[]> {
  indexPromise ??= fetch(withBase('/search-index.json'))
    .then((r) => (r.ok ? (r.json() as Promise<SearchEntry[]>) : []))
    .catch(() => []);
  return indexPromise;
}

/** The same markup as SearchCard.astro, built with text nodes only. */
export function resultCard(entry: SearchEntry): HTMLLIElement {
  const li = document.createElement('li');
  const a = li.appendChild(document.createElement('a'));
  a.className = 'result';
  a.href = entry.href;
  const art = a.appendChild(document.createElement('span'));
  art.className = 'result__art';
  if (entry.image) {
    const img = art.appendChild(document.createElement('img'));
    Object.assign(img, { src: entry.image, alt: '', width: 480, height: 270, decoding: 'async' });
  } else {
    art.classList.add('result__art--tile');
    if (entry.tone) art.style.setProperty('--tone', entry.tone);
    art.textContent = entry.name;
    art.setAttribute('aria-hidden', 'true');
  }
  for (const [cls, text] of [
    ['result__name', entry.name],
    ['result__meta', entry.meta],
  ]) {
    const span = a.appendChild(document.createElement('span'));
    span.className = cls;
    span.textContent = text;
  }
  return li;
}

interface Bindings {
  input: HTMLInputElement;
  results: HTMLElement;
  status: HTMLElement | null;
  clear?: HTMLButtonElement | null;
  limit: number;
  /** Called after each search with the query and how many matched. */
  onResults?: (query: string, count: number) => void;
  /** What an empty field shows; the panel shows nothing. */
  onEmpty?: () => void;
}

/**
 * Live search on one field: debounced, O(n) per query (src/lib/search.ts). Arrow keys move from
 * the field into the results and through them; Up from the first result returns to the field.
 */
export function bindSearch({
  input,
  results,
  status,
  clear,
  limit,
  onResults,
  onEmpty = () => results.replaceChildren(),
}: Bindings): {
  run: () => Promise<void>;
} {
  let timer = 0;
  const run = async () => {
    const query = input.value;
    if (clear) clear.hidden = !query;
    if (!query.trim()) {
      onEmpty();
      onResults?.(query, 0);
      if (status) status.textContent = '';
      return;
    }
    const found = search(await loadIndex(), query, limit);
    if (input.value !== query) return; // a newer keystroke owns the results now
    results.replaceChildren(...found.map(resultCard));
    if (status) status.textContent = resultsLabel(found.length, query);
    onResults?.(query, found.length);
  };
  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(run, DEBOUNCE_MS);
  });
  clear?.addEventListener('click', () => {
    input.value = '';
    void run();
    input.focus();
  });

  const links = () => [...results.querySelectorAll<HTMLAnchorElement>('a.result')];
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown') return;
    const first = links()[0];
    if (!first) return;
    e.preventDefault();
    first.focus();
  });
  results.addEventListener('keydown', (e) => {
    const all = links();
    const i = all.indexOf(document.activeElement as HTMLAnchorElement);
    if (i === -1) return;
    const step: Record<string, number> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };
    let next: number | undefined;
    if (e.key in step) next = i + step[e.key];
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = all.length - 1;
    if (next === undefined) return;
    e.preventDefault();
    if (next < 0) input.focus();
    else all[Math.min(next, all.length - 1)]?.focus();
  });
  return { run };
}
