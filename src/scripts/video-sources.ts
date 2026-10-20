/**
 * Adds a <video>'s sources from its data-sources (src/lib/trailers.ts, videoSources) the first
 * time it is needed, before its tracks. Until then there is nothing for any engine to fetch.
 */
export function attachSources(video: HTMLVideoElement): void {
  if (video.querySelector('source')) return;
  let sources: { src: string; type: string }[];
  try {
    sources = JSON.parse(video.dataset.sources ?? '[]');
  } catch {
    return;
  }
  const firstTrack = video.querySelector('track');
  for (const { src, type } of sources) {
    const source = document.createElement('source');
    source.src = src;
    source.type = type;
    video.insertBefore(source, firstTrack);
  }
}
