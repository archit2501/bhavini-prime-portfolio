import { parseCue, QUICK_VIEW_MS, type SceneItem } from '../lib/cues';
import { nextTab } from '../lib/title-page';

/**
 * Wires "Behind the scenes" inside one [data-player]: the metadata track's cues fill the quick
 * view; it shows with the player chrome and, for a few seconds, whenever the scene changes.
 * "View all" pauses the trailer and opens the full panel; closing it picks up where it was.
 */
export function initBehindTheScenes(root: HTMLElement): void {
  const video = root.querySelector<HTMLVideoElement>('[data-video]');
  const quick = root.querySelector<HTMLElement>('[data-bts]');
  const list = root.querySelector<HTMLElement>('[data-bts-list]');
  const full = root.querySelector<HTMLDialogElement>('[data-bts-full]');
  if (!video || !quick || !list || !full) return;

  const icon = (name: string) =>
    root
      .querySelector<HTMLTemplateElement>(`template[data-bts-icon="${name}"]`)
      ?.content.cloneNode(true);

  // The same markup as SceneRow.astro, built with text nodes only.
  const row = (item: SceneItem) => {
    const li = document.createElement('li');
    li.className = 'scene-row';
    const thumb = li.appendChild(document.createElement('span'));
    thumb.className = 'scene-row__thumb';
    if (item.thumb.tone) thumb.style.setProperty('--tone', item.thumb.tone);
    if (item.thumb.src) {
      const img = thumb.appendChild(document.createElement('img'));
      Object.assign(img, {
        src: item.thumb.src,
        alt: '',
        width: 64,
        height: 64,
        decoding: 'async',
      });
    } else if (item.thumb.icon) {
      const svg = icon(item.thumb.icon);
      if (svg) thumb.appendChild(svg);
    } else {
      const glyph = thumb.appendChild(document.createElement('span'));
      glyph.className = 'scene-row__glyph';
      glyph.textContent = item.thumb.glyph ?? '';
    }
    const text = li.appendChild(document.createElement('span'));
    text.className = 'scene-row__text';
    for (const [cls, value] of [
      ['scene-row__title', item.title],
      ['scene-row__detail', item.detail],
    ]) {
      const span = text.appendChild(document.createElement('span'));
      span.className = cls;
      span.textContent = value;
    }
    return li;
  };

  let chromeShown = root.dataset.chrome !== 'hidden';
  let flashing = false;
  let flashTimer = 0;
  const update = () => (quick.dataset.visible = String(chromeShown || flashing));
  root.addEventListener('chromechange', (e) => {
    chromeShown = (e as CustomEvent<boolean>).detail;
    update();
  });

  // Metadata tracks only fire cuechange while "hidden" (or "showing").
  const track = Array.from(video.textTracks).find((t) => t.kind === 'metadata');
  if (track) {
    track.mode = 'hidden';
    let current = '';
    track.addEventListener('cuechange', () => {
      const cues = track.activeCues;
      const cue = cues && cues.length ? (cues[cues.length - 1] as VTTCue) : undefined;
      const text = cue?.text ?? '';
      if (text === current) return;
      current = text;
      const items = text ? parseCue(text) : [];
      list.replaceChildren(...items.map(row));
      window.clearTimeout(flashTimer);
      flashing = items.length > 0;
      if (flashing) {
        flashTimer = window.setTimeout(() => {
          flashing = false;
          update();
        }, QUICK_VIEW_MS);
      }
      update();
    });
  }

  // View all: pause, open the panel, and resume on close if it was playing.
  let resume = false;
  const openBtn = root.querySelector<HTMLButtonElement>('[data-bts-open]');
  openBtn?.addEventListener('click', () => {
    resume = !video.paused && !video.ended;
    video.pause();
    full.showModal();
  });
  root.querySelector('[data-bts-close]')?.addEventListener('click', () => full.close());
  full.addEventListener('close', () => {
    // Safari never focused the clicked button, so hand focus back to it explicitly.
    openBtn?.focus({ preventScroll: true });
    if (resume) void video.play().catch(() => {});
    resume = false;
  });
  // A click on the backdrop (outside the panel's box) closes it too.
  full.addEventListener('click', (e) => {
    const r = full.getBoundingClientRect();
    const outside =
      e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    if (outside && e.target === full) full.close();
  });

  // Tabs: the ARIA tabs pattern with a roving tabindex, as on the detail page.
  const tabs = [...full.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const select = (index: number, focus = false) => {
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      const panel = full.querySelector<HTMLElement>(`#${tab.getAttribute('aria-controls')}`);
      if (panel) panel.hidden = !on;
    });
    if (focus) tabs[index]?.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (e) => {
      const next = nextTab(i, tabs.length, e.key);
      if (next === undefined) return;
      e.preventDefault();
      select(next, true);
    });
  });
}
