import { Dimensions, PixelRatio } from 'react-native';

/** The Figma frame every screen was designed on (390 × 844 at @1x). */
export const DESIGN_WIDTH = 390;
export const DESIGN_HEIGHT = 844;

// Computed once at startup. The app is portrait-only, so the short side is always the width.
const { width, height } = Dimensions.get('window');
const shortSide = Math.min(width, height);
const longSide = Math.max(width, height);
const widthRatio = shortSide / DESIGN_WIDTH;
const heightRatio = longSide / DESIGN_HEIGHT;

/** Scales a horizontal design value by the screen width ratio. */
export function scale(size: number): number {
  return PixelRatio.roundToNearestPixel(size * widthRatio);
}

/** Scales a vertical design value by the screen height ratio. */
export function verticalScale(size: number): number {
  return PixelRatio.roundToNearestPixel(size * heightRatio);
}

/**
 * Scales a design value by only a fraction of the width ratio, so values grow and shrink
 * more gently than the screen does. Used for font sizes and component sizes.
 */
export function moderateScale(size: number, factor = 0.5): number {
  return PixelRatio.roundToNearestPixel(size + (size * widthRatio - size) * factor);
}
