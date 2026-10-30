import type { JSX } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, sizes, spacing, type ColorToken, type TextVariant } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'inverse';
export type ButtonSize = 'lg' | 'md' | 'sm';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  /** primary teal · secondary white/slate text · outline white/teal text · danger soft red · inverse white on gradient */
  variant?: ButtonVariant;
  /** lg 56 · md 48 · sm 42 */
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: IconName;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

const textColorByVariant: Record<ButtonVariant, ColorToken> = {
  primary: 'primaryText',
  secondary: 'textBody',
  outline: 'primary',
  danger: 'danger',
  inverse: 'primary',
};

const textVariantBySize: Record<ButtonSize, TextVariant> = {
  lg: 'button',
  md: 'buttonSm',
  sm: 'buttonXs',
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  leftIcon,
  fullWidth = true,
  style,
  testID,
  accessibilityLabel,
}: ButtonProps): JSX.Element {
  const isInactive = disabled || loading;
  const textColor: ColorToken = disabled ? 'disabledText' : textColorByVariant[variant];

  const resolveStyle = ({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> => [
    styles.base,
    sizeStyles[size],
    variantStyles[variant],
    pressed && !isInactive ? pressedStyles[variant] : null,
    disabled ? styles.disabled : null,
    fullWidth ? styles.fullWidth : styles.inline,
    style,
  ];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={isInactive}
      onPress={onPress}
      style={resolveStyle}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={colors[textColor]} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? (
            <Icon name={leftIcon} size="md" color={textColor} style={styles.icon} />
          ) : null}
          <AppText variant={textVariantBySize[size]} color={textColor} numberOfLines={1}>
            {title}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: sizes.borderWidth,
    borderColor: colors.transparent,
    paddingHorizontal: spacing.xl,
  },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  icon: { marginRight: spacing.sm },
  fullWidth: { alignSelf: 'stretch' },
  inline: { alignSelf: 'flex-start' },
  disabled: { backgroundColor: colors.disabled, borderColor: colors.disabled },
});

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  lg: { height: sizes.buttonLg, borderRadius: radius.lg },
  md: { height: sizes.buttonMd, borderRadius: radius.md },
  sm: { height: sizes.buttonSm, borderRadius: radius.sm },
};

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderColor: colors.borderStrong },
  outline: { backgroundColor: colors.surface, borderColor: colors.borderStrong },
  danger: { backgroundColor: colors.dangerSurface },
  inverse: { backgroundColor: colors.surface },
};

const pressedStyles: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.primaryPressed },
  secondary: { backgroundColor: colors.surfaceMuted },
  outline: { backgroundColor: colors.primarySurface },
  danger: { backgroundColor: colors.dangerBorder },
  inverse: { backgroundColor: colors.primarySubtle },
};
