/**
 * Corner radii as measured (docs/DESIGN_INVENTORY.md §6). Deliberately not scaled: a 1–2 px
 * difference on a 360 dp phone is invisible, while crisp integer radii render better.
 */
export const radius = {
  xs: 4,
  sm: 10,
  md: 12,
  lg: 14,
  xl: 16,
  sheet: 28,
  full: 999,
} as const;

export type RadiusToken = keyof typeof radius;
