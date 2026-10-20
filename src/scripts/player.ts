import {
  countdownLeft,
  formatClock,
  HIDE_AFTER_MS,
  keyAction,
  NEXT_UP_SECONDS,
  remainingClock,
  seekTarget,
  showSkipIntro,
  SKIP_SECONDS,
  spokenPosition,
} from '../lib/player';

type Input = 'mouse' | 'touch' | 'key';

/** Fullscreen with Safari's prefixed fallbacks: iPhone only offers the video's own player. */
interface WebkitVideo extends HTMLVideoElement {
  webkitEnterFullscreen?: () => void;
}

/** Wires one [data-player]. Every handler is O(1); the only timers are the chrome and Next up. */
export function initPlayer(root: HTMLElement): void {
  const video = root.querySelector<WebkitVideo>('[data-video]');
  if (!video) return;
  const q = <T extends Element>(selector: string) => root.querySelector<T>(selector);
  const playBtn = q<HTMLButtonElement>('[data-play]');
  const playLabel = q<HTMLElement>('[data-play-label]');
  const scrub = q<HTMLInputElement>('[data-scrub]');
  const elapsed = q<HTMLElement>('[data-elapsed]');
  const remaining = q<HTMLElement>('[data-remaining]');
  const ccBtn = q<HTMLButtonElement>('[data-captions]');
  const fsBtn = q<HTMLButtonElement>('[data-fullscreen]');
  const skip = q<HTMLButtonElement>('[data-skip-intro]');
  const nextCard = q<HTMLElement>('[data-next-up]');
  const nextCount = q<HTMLElement>('[data-next-count]');
  const nextBar = q<HTMLElement>('[data-next-bar]');
  const status = q<HTMLElement>('[data-player-status]');
  const introEnd = Number(root.dataset.introEnd ?? 0);
  const closeHref = root.dataset.closeHref ?? '/';
  const nextHref = root.dataset.nextHref;
  const say = (text: string) => status && (status.textContent = text);

  let lastInput: Input = 'mouse';
  let hideTimer = 0;
  let dragging = false;

  // Chrome: shown on any input, faded after 3 s while playing. It stays while the keyboard is
  // in it or the mouse rests on a control, so nothing focused or pointed at disappears.
  // "Behind the scenes" follows the chrome through this event.
  const setChrome = (shown: boolean) => {
    const value = shown ? 'shown' : 'hidden';
    if (root.dataset.chrome === value) return;
    root.dataset.chrome = value;
    root.dispatchEvent(new CustomEvent('chromechange', { detail: shown }));
  };
  const busy = () =>
    !!root.querySelector('.player__chrome :focus-visible') ||
    (lastInput === 'mouse' &&
      !!root.querySelector('.player__top:hover, .player__centre:hover, .player__bottom:hover'));
  const wake = () => {
    setChrome(true);
    window.clearTimeout(hideTimer);
    if (root.dataset.state !== 'playing') return;
    hideTimer = window.setTimeout(function hide() {
      if (root.dataset.state !== 'playing') return;
      if (busy()) hideTimer = window.setTimeout(hide, HIDE_AFTER_MS);
      else setChrome(false);
    }, HIDE_AFTER_MS);
  };

  const setState = (state: 'playing' | 'paused' | 'ended') => {
    root.dataset.state = state;
    if (playLabel)
      playLabel.textContent = state === 'playing' ? 'Pause' : state === 'ended' ? 'Replay' : 'Play';
    wake();
  };
  const play = () => {
    setState('playing');
    void video.play().catch(() => setState(video.ended ? 'ended' : 'paused'));
  };
  const toggle = () => (video.paused || video.ended ? play() : video.pause());
  const seekBy = (delta: number) => {
    video.currentTime = seekTarget(video.currentTime, delta, video.duration);
    say(`${delta < 0 ? 'Back' : 'Forward'} ${Math.abs(delta)} seconds`);
  };

  video.addEventListener('play', () => setState('playing'));
  video.addEventListener('pause', () => !video.ended && setState('paused'));

  // Clock, scrubber and Skip intro follow the picture.
  const render = () => {
    const duration = Number.isFinite(video.duration) ? video.duration : Number(scrub?.max ?? 0);
    const t = video.currentTime;
    if (elapsed) elapsed.textContent = formatClock(t);
    if (remaining) remaining.textContent = remainingClock(t, duration);
    if (scrub) {
      if (!dragging) scrub.value = String(t);
      scrub.max = String(duration);
      scrub.style.setProperty('--progress', `${duration ? (t / duration) * 100 : 0}%`);
      scrub.setAttribute('aria-valuetext', spokenPosition(t, duration));
    }
    if (skip) skip.hidden = !showSkipIntro(t, introEnd);
  };
  for (const type of ['timeupdate', 'loadedmetadata', 'durationchange', 'seeked']) {
    video.addEventListener(type, render);
  }
  render();

  scrub?.addEventListener('pointerdown', () => (dragging = true));
  scrub?.addEventListener('input', () => {
    video.currentTime = Number(scrub.value);
    render();
  });
  scrub?.addEventListener('change', () => (dragging = false));

  skip?.addEventListener('click', () => {
    video.currentTime = introEnd;
    render();
    say('Intro skipped');
    playBtn?.focus({ preventScroll: true });
  });

  playBtn?.addEventListener('click', toggle);
  q('[data-back]')?.addEventListener('click', () => seekBy(-SKIP_SECONDS));
  q('[data-forward]')?.addEventListener('click', () => seekBy(SKIP_SECONDS));

  // Subtitles: the captions track carries every word the trailer shows.
  const track = Array.from(video.textTracks).find((t) => t.kind === 'captions');
  const setCaptions = (on: boolean) => {
    if (track) track.mode = on ? 'showing' : 'hidden';
    ccBtn?.setAttribute('aria-pressed', String(on));
  };
  setCaptions(false);
  ccBtn?.addEventListener('click', () => {
    const on = ccBtn.getAttribute('aria-pressed') !== 'true';
    setCaptions(on);
    say(on ? 'Subtitles on' : 'Subtitles off');
  });
  // Lift the cues clear of the scrubber.
  video.querySelector('track')?.addEventListener('load', () => {
    for (const cue of Array.from(track?.cues ?? [])) {
      if ('line' in cue) (cue as VTTCue).line = -3;
    }
  });

  const muteBtn = q<HTMLButtonElement>('[data-mute]');
  const noSound = () => say('This trailer has no sound');
  muteBtn?.addEventListener('click', noSound);

  // Full screen on the whole player, so the chrome comes along; iPhone hands over to its own.
  const canFullscreen = document.fullscreenEnabled || !!video.webkitEnterFullscreen;
  if (fsBtn && !canFullscreen) fsBtn.hidden = true;
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (document.fullscreenEnabled) void root.requestFullscreen().catch(() => {});
    else video.webkitEnterFullscreen?.();
  };
  fsBtn?.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', () =>
    fsBtn?.setAttribute('aria-pressed', String(document.fullscreenElement === root)),
  );

  // The picture: a click plays or pauses; a tap shows or hides the chrome.
  const surface = q<HTMLElement>('[data-surface]');
  let touchedAt = 0;
  surface?.addEventListener('touchstart', () => (touchedAt = Date.now()), { passive: true });
  surface?.addEventListener('click', () => {
    if (Date.now() - touchedAt < 800) {
      lastInput = 'touch';
      if (root.dataset.chrome === 'hidden') wake();
      else if (root.dataset.state === 'playing') setChrome(false);
      return;
    }
    lastInput = 'mouse';
    toggle();
  });
  root.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    lastInput = 'mouse';
    wake();
  });
  root.addEventListener('touchstart', () => (lastInput = 'touch'), { passive: true });
  root.addEventListener('focusin', wake);

  // Keyboard: space/k, arrows/j/l, f, m, c and Esc. Buttons and the scrubber keep their own keys.
  document.addEventListener('keydown', (e) => {
    // An open dialog (the full "Behind the scenes" panel) keeps its own keys, Esc included.
    if (e.metaKey || e.ctrlKey || e.altKey || root.querySelector('dialog[open]')) return;
    lastInput = 'key';
    wake();
    const target = e.target as HTMLElement | null;
    const onControl = !!target?.closest('button, a');
    const onScrub = target === scrub;
    if (onControl && (e.key === ' ' || e.key === 'Enter')) return;
    if (onScrub && /^(Arrow|Home|End|Page)/.test(e.key)) return;
    const action = keyAction(e.key);
    if (!action) return;
    e.preventDefault();
    if (action === 'toggle') toggle();
    else if (action === 'back') seekBy(-SKIP_SECONDS);
    else if (action === 'forward') seekBy(SKIP_SECONDS);
    else if (action === 'fullscreen' && canFullscreen) toggleFullscreen();
    else if (action === 'mute') noSound();
    else if (action === 'captions') ccBtn?.click();
    else if (action === 'close' && !document.fullscreenElement) location.assign(closeHref);
  });

  // Next up: when the trailer ends, count 10 s down to the next title. Hide cancels it.
  let countdown = 0;
  const stopCountdown = () => {
    window.clearInterval(countdown);
    countdown = 0;
    if (nextCard) nextCard.hidden = true;
  };
  video.addEventListener('ended', () => {
    setState('ended');
    if (!nextCard || !nextHref) return;
    const startedAt = Date.now();
    nextCard.hidden = false;
    say(`Next up: ${root.dataset.nextTitle}, in ${NEXT_UP_SECONDS} seconds`);
    const tick = () => {
      const left = countdownLeft(startedAt, Date.now());
      if (nextCount) nextCount.textContent = String(left);
      if (nextBar)
        nextBar.style.width = `${Math.min(100, (Date.now() - startedAt) / (NEXT_UP_SECONDS * 10))}%`;
      if (left === 0) {
        stopCountdown();
        location.assign(nextHref);
      }
    };
    tick();
    countdown = window.setInterval(tick, 250);
  });
  video.addEventListener('playing', stopCountdown);
  video.addEventListener(
    'seeking',
    () => video.currentTime < video.duration - 0.5 && stopCountdown(),
  );
  q('[data-next-cancel]')?.addEventListener('click', () => {
    stopCountdown();
    say('Next up hidden');
    playBtn?.focus({ preventScroll: true });
  });

  // Start playing, unless motion is reduced: then it waits on the play button.
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) play();
  else setState('paused');
}
