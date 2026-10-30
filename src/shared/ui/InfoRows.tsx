import type { JSX, ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, sizes, spacing } from '@/shared/theme';

import { AppText } from './AppText';

export interface InfoRow {
  label: string;
  value: string | ReactNode;
}

export interface InfoRowsProps {
  rows: InfoRow[];
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Label / value rows inside a card, as on Member details and Profile. */
export function InfoRows({ rows, style, testID }: InfoRowsProps): JSX.Element {
  return (
    <View style={[styles.card, style]} testID={testID}>
      {rows.map((row, index) => (
        <View
          key={row.label}
          style={[styles.row, index < rows.length - 1 ? styles.rowDivider : null]}
        >
          <AppText variant="label" weight="regular" color="textSecondary">
            {row.label}
          </AppText>
          {typeof row.value === 'string' ? (
            <AppText
              variant="label"
              weight="semibold"
              align="right"
              style={styles.value}
              numberOfLines={2}
            >
              {row.value}
            </AppText>
          ) : (
            <View style={styles.valueSlot}>{row.value}</View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingVertical: spacing.xs,
  },
  row: {
    minHeight: sizes.infoRow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  rowDivider: { borderBottomWidth: sizes.borderWidth, borderBottomColor: colors.border },
  value: { flex: 1, marginLeft: spacing.md },
  valueSlot: { flex: 1, alignItems: 'flex-end', marginLeft: spacing.md },
});
