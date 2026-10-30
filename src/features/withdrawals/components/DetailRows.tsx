import type { JSX } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { spacing } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export interface DetailRow {
  label: string;
  value: string;
}

export interface DetailRowsProps {
  rows: readonly DetailRow[];
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Label / value pairs without dividers, inside a card (E 5.3 request details). */
export function DetailRows({ rows, style, testID }: DetailRowsProps): JSX.Element {
  return (
    <View style={[styles.list, style]} testID={testID}>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <AppText variant="label" weight="regular" color="textSecondary">
            {row.label}
          </AppText>
          <AppText
            variant="label"
            weight="semibold"
            align="right"
            numberOfLines={2}
            style={styles.value}
          >
            {row.value}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  value: { flex: 1, marginLeft: spacing.md },
});
