import type { JSX } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { colors, radius, sizes, spacing, statusTones, type StatusTone } from '@/shared/theme';

import { AppText } from './AppText';

export interface BadgeProps {
  label: string;
  tone?: StatusTone;
  /** 6 dp leading dot, as on the designed status pills. */
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** 22 dp status pill. */
export function Badge({
  label,
  tone = 'brand',
  dot = false,
  style,
  testID,
}: BadgeProps): JSX.Element {
  return (
    <View style={[styles.pill, surfaceStyles[tone], style]} testID={testID}>
      {dot ? <View style={[styles.dot, dotStyles[tone]]} /> : null}
      <AppText variant="caption" weight="semibold" style={textStyles[tone]} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: sizes.pill,
    paddingHorizontal: spacing.sm + spacing.xxs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
  },
  dot: {
    width: sizes.dot,
    height: sizes.dot,
    borderRadius: radius.full,
    marginRight: spacing.sm - spacing.xxs,
  },
});

const surfaceStyles: Record<StatusTone, ViewStyle> = {
  success: { backgroundColor: statusTones.success.surface },
  warning: { backgroundColor: statusTones.warning.surface },
  danger: { backgroundColor: statusTones.danger.surface },
  info: { backgroundColor: statusTones.info.surface },
  brand: { backgroundColor: statusTones.brand.surface },
  neutral: { backgroundColor: statusTones.neutral.surface },
};

const dotStyles: Record<StatusTone, ViewStyle> = {
  success: { backgroundColor: statusTones.success.dot },
  warning: { backgroundColor: statusTones.warning.dot },
  danger: { backgroundColor: statusTones.danger.dot },
  info: { backgroundColor: statusTones.info.dot },
  brand: { backgroundColor: statusTones.brand.dot },
  neutral: { backgroundColor: statusTones.neutral.dot },
};

const textStyles: Record<StatusTone, TextStyle> = {
  success: { color: statusTones.success.text },
  warning: { color: statusTones.warning.text },
  danger: { color: statusTones.danger.text },
  info: { color: statusTones.info.text },
  brand: { color: statusTones.brand.text },
  neutral: { color: statusTones.neutral.text },
};
