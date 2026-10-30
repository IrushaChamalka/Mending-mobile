import { scale } from './scale';

/** Spacing scale in design steps of 4, scaled once by the screen width ratio. */
export const spacing = {
  xxs: scale(2),
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(20),
  xxl: scale(24),
  xxxl: scale(32),
  huge: scale(40),
} as const;

export type SpacingToken = keyof typeof spacing;
