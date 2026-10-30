import type { JSX } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, sizes, spacing } from '@/shared/theme';

import { AppText } from './AppText';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** 38 dp filter chip: teal when selected, white with a slate border otherwise. */
export function Chip({ label, selected = false, onPress, style, testID }: ChipProps): JSX.Element {
  const resolveStyle = ({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> => [
    styles.chip,
    selected ? styles.selected : null,
    pressed ? styles.pressed : null,
    style,
  ];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={resolveStyle}
      testID={testID}
    >
      <AppText variant="buttonXs" color={selected ? 'primaryText' : 'textMuted'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: sizes.chip,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: sizes.borderWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { opacity: 0.8 },
});
