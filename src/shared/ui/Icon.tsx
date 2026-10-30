// Per-family imports: the package root would bundle every icon font (about 4 MB) for two families.
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { JSX } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { colors, iconSizes, type ColorToken, type IconSizeToken } from '@/shared/theme';

/**
 * Glyphs the employee designs use that Feather does not have (the designs draw Lucide icons), taken
 * from Material Community Icons' outline set. Keep this list short: it is the only reason that
 * font ships.
 */
const EXTRA_GLYPHS = {
  wallet: 'wallet-outline',
  banknote: 'cash',
  bank: 'bank-outline',
  'list-checks': 'format-list-checks',
} as const satisfies Record<string, keyof typeof MaterialCommunityIcons.glyphMap>;

type ExtraIconName = keyof typeof EXTRA_GLYPHS;

export type IconName = keyof typeof Feather.glyphMap | ExtraIconName;

export interface IconProps {
  name: IconName;
  size?: IconSizeToken;
  /** A theme color token. */
  color?: ColorToken;
  /** A resolved color value for tone-driven components; wins over `color`. */
  tintColor?: string;
  style?: StyleProp<TextStyle>;
}

function isExtraGlyph(name: IconName): name is ExtraIconName {
  return Object.hasOwn(EXTRA_GLYPHS, name);
}

/** The icon fonts to load behind the splash screen. */
export const iconFonts = { ...Feather.font, ...MaterialCommunityIcons.font };

/** Feather glyph (or one of the few extras) sized and colored from theme tokens (docs/DESIGN_INVENTORY.md §8). */
export function Icon({
  name,
  size = 'md',
  color = 'textPrimary',
  tintColor,
  style,
}: IconProps): JSX.Element {
  const resolvedColor = tintColor ?? colors[color];
  if (isExtraGlyph(name)) {
    return (
      <MaterialCommunityIcons
        name={EXTRA_GLYPHS[name]}
        size={iconSizes[size]}
        color={resolvedColor}
        style={style}
      />
    );
  }
  return <Feather name={name} size={iconSizes[size]} color={resolvedColor} style={style} />;
}
