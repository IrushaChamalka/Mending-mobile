import type { JSX } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { Chip } from '@/shared/ui';

import type { WithdrawalFilter } from '../domain/withdrawalRules';

export interface WithdrawalFilterChipsProps {
  options: readonly { value: WithdrawalFilter; label: string }[];
  selected: WithdrawalFilter;
  onSelect: (filter: WithdrawalFilter) => void;
}

/** All / Pending / Paid / Rejected (E 5.5). */
export function WithdrawalFilterChips({
  options,
  selected,
  onSelect,
}: WithdrawalFilterChipsProps): JSX.Element {
  return (
    <View style={styles.row}>
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          selected={option.value === selected}
          onPress={() => {
            onSelect(option.value);
          }}
          testID={`withdrawal-filter-${option.value}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
