import type { JSX } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import {
  colors,
  fontFamilyStyles,
  MAX_FONT_SIZE_MULTIPLIER,
  textVariants,
  type ColorToken,
  type FontWeightToken,
  type TextVariant,
} from '@/shared/theme';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: ColorToken;
  /** Overrides the variant's weight. */
  weight?: FontWeightToken;
  align?: 'left' | 'center' | 'right';
}

// One `{ color }` style per token, built from the theme so no literal ever appears here.
const colorStyles = Object.fromEntries(
  Object.entries(colors).map(([token, value]) => [token, { color: value }]),
) as Record<ColorToken, TextStyle>;

const alignStyles: Record<'left' | 'center' | 'right', TextStyle> = {
  left: { textAlign: 'left' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
};

/** The only text primitive used in the app. Caps font scaling so large system fonts keep layouts intact. */
export function AppText({
  variant = 'body',
  color = 'textPrimary',
  weight,
  align,
  style,
  children,
  ...rest
}: AppTextProps): JSX.Element {
  return (
    <Text
      maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
      {...rest}
      style={[
        textVariants[variant],
        colorStyles[color],
        weight ? fontFamilyStyles[weight] : null,
        align ? alignStyles[align] : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}
