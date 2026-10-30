import type { JSX } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from './AppText';
import { TextButton } from './TextButton';

export interface SectionHeaderProps {
  title: string;
  /** Right-hand link, e.g. "See all". */
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Section title with an optional link (E 2.1 "Today's tasks · See all", E 3.2 "My progress"). */
export function SectionHeader({
  title,
  actionLabel,
  onAction,
  style,
  testID,
}: SectionHeaderProps): JSX.Element {
  return (
    <View style={[styles.row, style]} testID={testID}>
      <AppText variant="cardTitle" accessibilityRole="header" style={styles.title}>
        {title}
      </AppText>
      {actionLabel && onAction ? <TextButton title={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1 },
});
