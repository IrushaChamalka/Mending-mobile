import type { JSX } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { spacing, type ColorToken, type TextVariant } from '@/shared/theme';

import { AppText } from './AppText';

export interface TextButtonProps {
  title: string;
  onPress: () => void;
  /** label (default) for inline links such as "Forgot password?" and "See all". */
  variant?: TextVariant;
  color?: ColorToken;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

/** Teal text link ("Forgot password?", "See all", "Resend code"). */
export function TextButton({
  title,
  onPress,
  variant = 'label',
  color = 'primary',
  disabled = false,
  style,
  testID,
  accessibilityLabel,
}: TextButtonProps): JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={disabled}
      onPress={onPress}
      hitSlop={spacing.sm}
      style={({ pressed }) => [pressed ? styles.pressed : null, style]}
      testID={testID}
    >
      <AppText variant={variant} weight="semibold" color={disabled ? 'textPlaceholder' : color}>
        {title}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.6 },
});
