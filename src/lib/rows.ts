/** Paging maths for the horizontal title rows. Pure, so the scroll rules are unit-tested. */

export interface ScrollBox {
  scrollLeft: number;
  clientWidth: number;
  scrollWidth: number;
}

/** 2px of slack so sub-pixel scroll positions still count as the end. */
const SLACK = 2;

export function atStart(box: ScrollBox): boolean {
  return box.scrollLeft <= SLACK;
}

export function atEnd(box: ScrollBox): boolean {
  return box.scrollLeft + box.clientWidth >= box.scrollWidth - SLACK;
}

/**
 * Where a chevron press scrolls to: one visible page, less one card so the card that peeked
 * at the edge stays in view (as Prime's rows page). Clamped to the track. O(1).
 */
export function pageTarget(box: ScrollBox, direction: 1 | -1, cardWidth: number): number {
  const page = Math.max(cardWidth, box.clientWidth - cardWidth);
  const max = Math.max(0, box.scrollWidth - box.clientWidth);
  return Math.min(max, Math.max(0, box.scrollLeft + direction * page));
}
