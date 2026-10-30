/**
 * The resize that brings an image's longest side down to `maxSide`, keeping its aspect ratio, or
 * null when the image is already small enough (photos are never upscaled).
 */
export function fitWithin(
  width: number,
  height: number,
  maxSide: number,
): { width: number } | { height: number } | null {
  if (Math.max(width, height) <= maxSide) return null;
  return width >= height ? { width: maxSide } : { height: maxSide };
}
