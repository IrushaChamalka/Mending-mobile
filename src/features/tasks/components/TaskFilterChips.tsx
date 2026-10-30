import type { JSX } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { spacing } from '@/shared/theme';
import { Chip } from '@/shared/ui';

import type { TaskFilter } from '../domain/taskFilters';

export interface TaskFilterChipsProps {
  options: readonly { value: TaskFilter; label: string }[];
  selected: TaskFilter;
  onSelect: (filter: TaskFilter) => void;
}

/** Status filter chips (the chip style of M 5.1), scrolling sideways on narrow phones. */
export function TaskFilterChips({
  options,
  selected,
  onSelect,
}: TaskFilterChipsProps): JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          selected={option.value === selected}
          onPress={() => {
            onSelect(option.value);
          }}
          testID={`task-filter-${option.value}`}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: { flexGrow: 0 },
  row: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, gap: spacing.sm },
});
