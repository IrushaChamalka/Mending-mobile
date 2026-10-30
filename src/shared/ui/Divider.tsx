import type { JSX } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, sizes, spacing } from '@/shared/theme';

import { AppText } from './AppText';

export interface DividerProps {
  /** Centred label, as the "or" divider on the login screen. */
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export function Divider({ label, style }: DividerProps): JSX.Element {
  if (!label) {
    return <View style={[styles.line, style]} />;
  }
  return (
    <View style={[styles.row, style]}>
      <View style={[styles.line, styles.flex]} />
      <AppText variant="caption" color="textPlaceholder" style={styles.label}>
        {label}
      </AppText>
      <View style={[styles.line, styles.flex]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  line: { height: sizes.borderWidth, backgroundColor: colors.border },
  label: { marginHorizontal: spacing.md },
});
