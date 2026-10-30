import type { JSX } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, sizes, spacing, type ColorToken } from '@/shared/theme';

import { AppText } from './AppText';

export type StatTileTone = 'outlined' | 'brand' | 'success' | 'warning' | 'danger';

export interface StatTileProps {
  label: string;
  value: string;
  /** outlined = white with border (Home KPI) · others = tinted (details, review) */
  tone?: StatTileTone;
  /** lg = 22 dp value · md = 18 dp value */
  size?: 'md' | 'lg';
  /** Overrides the tone's value color (the Home tiles use teal, green and slate). */
  valueColor?: ColorToken;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const valueColorByTone: Record<StatTileTone, ColorToken> = {
  outlined: 'primary',
  brand: 'primary',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

/** Value-over-label tile. Give it `flex: 1` inside a row via `style` or wrap in a flex row. */
export function StatTile({
  label,
  value,
  tone = 'brand',
  size = 'lg',
  valueColor,
  style,
  testID,
}: StatTileProps): JSX.Element {
  return (
    <View style={[styles.tile, toneStyles[tone], style]} testID={testID}>
      <AppText
        variant={size === 'lg' ? 'stat' : 'value'}
        color={valueColor ?? valueColorByTone[tone]}
        align="center"
      >
        {value}
      </AppText>
      <AppText
        variant="micro"
        weight="regular"
        color={tone === 'outlined' ? 'textSecondary' : 'textMuted'}
        align="center"
        numberOfLines={1}
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: sizes.statTile,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
});

const toneStyles: Record<StatTileTone, ViewStyle> = {
  outlined: {
    backgroundColor: colors.surface,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  brand: { backgroundColor: colors.primarySurface },
  success: { backgroundColor: colors.successSurface },
  warning: { backgroundColor: colors.warningSurface },
  danger: { backgroundColor: colors.dangerSurface },
};
