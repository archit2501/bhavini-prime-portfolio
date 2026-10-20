/**
 * Geometry for the expanded hover card (task 2.2.4). Prime scales the card's art 1.56x about its
 * centre; near the edges of the screen the expanded card slides inward instead of being cut off,
 * and it never rises under the sticky nav. Pure and O(1).
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Bounds {
  /** Visible width of the page. */
  width: number;
  /** Lowest y the expanded art may start at (the bottom of the nav). */
  top: number;
  /** Space kept clear at the screen edges. */
  margin: number;
}

export interface Geometry {
  left: number;
  top: number;
  width: number;
  artHeight: number;
  /** Where the card sits inside the expanded box, as a transform-origin, in px. */
  originX: number;
  originY: number;
}

export function previewGeometry(card: Rect, bounds: Bounds, scale: number): Geometry {
  const width = card.width * scale;
  const artHeight = card.height * scale;
  const cx = card.x + card.width / 2;
  const cy = card.y + card.height / 2;
  const maxLeft = Math.max(bounds.margin, bounds.width - bounds.margin - width);
  const left = Math.min(maxLeft, Math.max(bounds.margin, cx - width / 2));
  const top = Math.max(bounds.top + bounds.margin, cy - artHeight / 2);
  // Scaling the expanded box by 1/scale about (originX, originY) moves its corner by
  // origin x (1 - 1/scale); solving for the card's corner starts the art exactly over the card.
  const originX = scale === 1 ? 0 : (card.x - left) / (1 - 1 / scale);
  const originY = scale === 1 ? 0 : (card.y - top) / (1 - 1 / scale);
  return { left, top, width, artHeight, originX, originY };
}

/** Prime's scale steps: 1.56 at 1280px and wider, smaller on narrower screens. */
export function previewScale(viewportWidth: number): number {
  if (viewportWidth >= 1280) return 1.56;
  if (viewportWidth >= 880) return 1.4;
  return 1.25;
}
