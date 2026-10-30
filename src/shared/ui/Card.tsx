import type { JSX, ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, sizes, spacing } from '@/shared/theme';

import { Icon } from './Icon';

export interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  /** 16 dp inner padding (default). Turn off for row-based cards. */
  padded?: boolean;
  tone?: 'default' | 'danger';
  /** Top-right chevron for pressable cards. */
  chevron?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

/** White card with a 1 dp slate border and radius 16, flat as designed. */
export function Card({
  children,
  onPress,
  padded = true,
  tone = 'default',
  chevron = false,
  style,
  testID,
  accessibilityLabel,
}: CardProps): JSX.Element {
  const baseStyles = [
    styles.card,
    padded ? styles.padded : null,
    tone === 'danger' ? styles.danger : null,
  ];

  if (!onPress) {
    return (
      <View style={[...baseStyles, style]} testID={testID}>
        {children}
      </View>
    );
  }

  const resolveStyle = ({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> => [
    ...baseStyles,
    pressed ? styles.pressed : null,
    style,
  ];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={resolveStyle}
      testID={testID}
    >
      {children}
      {chevron ? (
        <Icon name="chevron-right" size="sm" color="textPlaceholder" style={styles.chevron} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    borderRadius: radius.xl,
  },
  padded: { padding: spacing.lg },
  danger: { borderColor: colors.dangerBorderStrong },
  pressed: { backgroundColor: colors.surfaceMuted },
  chevron: { position: 'absolute', top: spacing.lg, right: spacing.lg },
});
