import type { JSX } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, sizes, type ColorToken } from '@/shared/theme';

import { Icon, type IconName } from './Icon';

export type IconButtonVariant = 'muted' | 'overlay' | 'surface';

export interface IconButtonProps {
  icon: IconName;
  accessibilityLabel: string;
  onPress?: () => void;
  /** muted = slate circle (headers) · overlay = white 16 % (gradient, camera) · surface = white with border */
  variant?: IconButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const iconColorByVariant: Record<IconButtonVariant, ColorToken> = {
  muted: 'textBody',
  overlay: 'primaryText',
  surface: 'textBody',
};

/** 40 dp circular icon button. */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'muted',
  disabled = false,
  style,
  testID,
}: IconButtonProps): JSX.Element {
  const resolveStyle = ({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> => [
    styles.base,
    variantStyles[variant],
    pressed ? styles.pressed : null,
    style,
  ];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={sizes.dot}
      style={resolveStyle}
      testID={testID}
    >
      <Icon name={icon} size="md" color={iconColorByVariant[variant]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: sizes.iconButton,
    height: sizes.iconButton,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});

const variantStyles: Record<IconButtonVariant, ViewStyle> = {
  muted: { backgroundColor: colors.surfaceMuted },
  overlay: { backgroundColor: colors.overlayOnPrimary },
  surface: {
    backgroundColor: colors.surface,
    borderWidth: sizes.borderWidth,
    borderColor: colors.borderStrong,
  },
};
