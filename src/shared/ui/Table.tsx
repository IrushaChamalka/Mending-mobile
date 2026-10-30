import type { JSX, ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, sizes, spacing } from '@/shared/theme';

import { AppText } from './AppText';

export interface TableColumn {
  label: string;
  /** Share of the row width. */
  flex: number;
  align?: 'left' | 'right';
}

export interface TableHeaderProps {
  columns: readonly TableColumn[];
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The top of a table card (E 4.2, E 5.5): slate-50, rounded top corners and uppercase column titles. Rows
 * draw their own side borders, so a FlashList can render header, rows and footer as one card.
 */
export function TableHeader({ columns, style, testID }: TableHeaderProps): JSX.Element {
  return (
    <View style={[styles.edges, styles.header, style]} testID={testID}>
      {columns.map((column) => (
        <View
          key={column.label}
          style={[{ flex: column.flex }, styles.headerCell, alignStyles[column.align ?? 'left']]}
        >
          <AppText variant="overline" color="textSecondary" numberOfLines={1}>
            {column.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

export interface TableRowProps {
  columns: readonly TableColumn[];
  /** One cell per column, in column order. */
  children: ReactNode[];
  /** Closes the card: bottom border and rounded bottom corners. */
  last?: boolean;
  /** `total` = the teal subtotal row. */
  tone?: 'default' | 'total';
  testID?: string;
}

/** A table row whose cells follow the header's column widths and alignment. */
export function TableRow({
  columns,
  children,
  last = false,
  tone = 'default',
  testID,
}: TableRowProps): JSX.Element {
  return (
    <View
      style={[
        styles.edges,
        styles.row,
        tone === 'total' ? styles.total : null,
        last ? styles.last : styles.divider,
      ]}
      testID={testID}
    >
      {columns.map((column, index) => (
        <View
          key={column.label}
          style={[{ flex: column.flex }, styles.cell, alignStyles[column.align ?? 'left']]}
        >
          {children[index]}
        </View>
      ))}
    </View>
  );
}

export interface TableEmptyRowProps {
  message: string;
  testID?: string;
}

/** The card's only row when there is nothing to list. */
export function TableEmptyRow({ message, testID }: TableEmptyRowProps): JSX.Element {
  return (
    <View style={[styles.edges, styles.emptyRow, styles.last]} testID={testID}>
      <AppText variant="label" weight="regular" color="textSecondary" align="center">
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  edges: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderLeftWidth: sizes.borderWidth,
    borderRightWidth: sizes.borderWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  header: {
    minHeight: sizes.tableHeader,
    backgroundColor: colors.background,
    borderTopWidth: sizes.borderWidth,
    borderBottomWidth: sizes.borderWidth,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  row: { minHeight: sizes.tableRow },
  // Header and row cells share the right padding, so right-aligned titles sit over their values.
  headerCell: { paddingRight: spacing.xs },
  cell: { paddingVertical: spacing.sm, paddingRight: spacing.xs },
  divider: { borderBottomWidth: sizes.borderWidth },
  last: {
    borderBottomWidth: sizes.borderWidth,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  total: { backgroundColor: colors.primarySurface },
  emptyRow: { minHeight: sizes.tableRow, justifyContent: 'center' },
});

const alignStyles: Record<'left' | 'right', ViewStyle> = {
  left: { alignItems: 'flex-start' },
  right: { alignItems: 'flex-end' },
};
