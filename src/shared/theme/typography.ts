import type { TextStyle } from 'react-native';

import { moderateScale } from './scale';

/**
 * Inter static faces bundled through the expo-font config plugin (app.config.ts). The family
 * names equal the file names, which Android uses, and the PostScript names, which iOS uses.
 * Each weight is its own family on purpose: custom fonts do not synthesise weights on Android,
 * so components set `fontFamily` and never `fontWeight`.
 */
export const fontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

export type FontWeightToken = keyof typeof fontFamily;

/** Font sizes scale by only 30 % of the width ratio so they stay readable on small phones. */
export const FONT_SCALE_FACTOR = 0.3;

/** Caps the system font-size setting so large text does not break layouts. */
export const MAX_FONT_SIZE_MULTIPLIER = 1.3;

function textStyle(size: number, lineHeight: number, weight: FontWeightToken): TextStyle {
  return {
    fontSize: moderateScale(size, FONT_SCALE_FACTOR),
    lineHeight: moderateScale(lineHeight, FONT_SCALE_FACTOR),
    fontFamily: fontFamily[weight],
  };
}

/** Text variants measured from the designs (docs/DESIGN_INVENTORY.md §4). */
export const textVariants = {
  /** Balances (E 2.1 "LKR 15,560"). */
  amount: textStyle(32, 38, 'bold'),
  display: textStyle(28, 34, 'bold'),
  stat: textStyle(22, 28, 'bold'),
  title: textStyle(20, 26, 'bold'),
  value: textStyle(18, 24, 'bold'),
  heading: textStyle(17, 24, 'bold'),
  cardTitle: textStyle(16, 22, 'bold'),
  listTitle: textStyle(15, 22, 'semibold'),
  subtitle: textStyle(15, 22, 'regular'),
  input: textStyle(16, 22, 'regular'),
  body: textStyle(14, 20, 'regular'),
  /** Secondary paragraphs under a section title (M 4.2). */
  bodySmall: textStyle(13, 18, 'regular'),
  bodyStrong: textStyle(14, 20, 'semibold'),
  label: textStyle(13, 16, 'medium'),
  caption: textStyle(12, 16, 'regular'),
  micro: textStyle(11, 14, 'medium'),
  overline: {
    ...textStyle(10, 12, 'semibold'),
    textTransform: 'uppercase',
    letterSpacing: moderateScale(0.3, FONT_SCALE_FACTOR),
  },
  button: textStyle(16, 22, 'semibold'),
  buttonSm: textStyle(14, 20, 'semibold'),
  buttonXs: textStyle(13, 18, 'semibold'),
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof textVariants;

/** Overrides the weight of any variant without changing its size. */
export const fontFamilyStyles: Record<FontWeightToken, TextStyle> = {
  regular: { fontFamily: fontFamily.regular },
  medium: { fontFamily: fontFamily.medium },
  semibold: { fontFamily: fontFamily.semibold },
  bold: { fontFamily: fontFamily.bold },
};
