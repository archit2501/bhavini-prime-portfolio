import { playFlourish } from '../lib/flourish';

/** How long the ident runs before it lets go of the page. */
export const IDENT_MS = 3200;
const IDENT_KEY = 'bhavini:ident';

const played = () => {
  try {
    return sessionStorage.getItem(IDENT_KEY) === '1';
  } catch {
    return false;
  }
};

const markPlayed = () => {
  try {
    sessionStorage.setItem(IDENT_KEY, '1');
  } catch {
    /* storage blocked: it may play again next page, which is harmless */
  }
};

type Ctx = AudioContext & { resume?: () => Promise<void> };
type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

/**
 * Plays the ident once per session, then hands focus to `returnFocus`. Call it from inside the
 * user's gesture (a click): that is what lets browsers start the sound. Under reduced motion it
 * never plays, sound included.
 */
export function playIdent(returnFocus?: HTMLElement | null): Promise<void> {
  const dialog = document.querySelector<HTMLDialogElement>('[data-ident]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!dialog || played() || reduced) {
    markPlayed();
    return Promise.resolve();
  }
  markPlayed();

  let ctx: Ctx | undefined;
  try {
    const Audio = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (Audio) {
      ctx = new Audio() as Ctx;
      void ctx.resume?.()?.catch?.(() => {});
      playFlourish(ctx);
    }
  } catch {
    /* no sound is fine */
  }

  dialog.showModal();
  dialog.dataset.playing = 'true';
  return new Promise((resolve) => {
    let finished = false;
    const finish = (skipped: boolean) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      dialog.close();
      delete dialog.dataset.playing;
      // Skip silences it; otherwise let the last note ring out.
      window.setTimeout(() => void ctx?.close?.().catch(() => {}), skipped ? 0 : 400);
      returnFocus?.focus({ preventScroll: true });
      resolve();
    };
    const timer = window.setTimeout(() => finish(false), IDENT_MS);
    dialog.querySelector('[data-ident-skip]')?.addEventListener('click', () => finish(true), {
      once: true,
    });
    dialog.addEventListener(
      'cancel',
      (e) => {
        e.preventDefault();
        finish(true);
      },
      { once: true },
    );
  });
}

// The first profile pick of the session plays it (the pick is the gesture the sound needs).
document.addEventListener('profilechange', () => {
  void playIdent(document.querySelector<HTMLElement>('[data-avatar]'));
});
