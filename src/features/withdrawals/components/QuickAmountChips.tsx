import type { JSX } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { Chip } from '@/shared/ui';

export interface QuickAmountChipsProps {
  /** "5,000", "10,000", "Max 15,560". */
  options: readonly { label: string; value: number }[];
  onSelect: (value: number) => void;
}

/** Amount shortcuts under the amount field (E 5.1). */
export function QuickAmountChips({ options, onSelect }: QuickAmountChipsProps): JSX.Element {
  return (
    <View style={styles.row}>
      {options.map((option) => (
        <Chip
          key={option.label}
          label={option.label}
          onPress={() => {
            onSelect(option.value);
          }}
          testID={`quick-amount-${option.value}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
