import type { JSX } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, sizes, spacing, type StatusTone } from '@/shared/theme';

import { AppText } from './AppText';
import { Badge } from './Badge';

export interface QueueRowProps {
  title: string;
  subtitle?: string;
  statusLabel: string;
  statusTone: StatusTone;
  onRetry?: () => void;
  /** Shown for failed items: deletes the submission from this device (confirm first). */
  onDiscard?: () => void;
  /** Bottom separator; omit on the last row. */
  divider?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Upload-queue row: text, status pill and optional "Retry" (M 6.1 Sync center). */
export function QueueRow({
  title,
  subtitle,
  statusLabel,
  statusTone,
  onRetry,
  onDiscard,
  divider = false,
  style,
  testID,
}: QueueRowProps): JSX.Element {
  return (
    <View style={[styles.row, divider ? styles.divider : null, style]} testID={testID}>
      <View style={styles.texts}>
        <AppText variant="body" color="textBody" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <Badge label={statusLabel} tone={statusTone} dot />
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={`Retry ${title}`}
          hitSlop={spacing.sm}
          style={styles.action}
        >
          <AppText variant="buttonXs" color="primary">
            Retry
          </AppText>
        </Pressable>
      ) : null}
      {onDiscard ? (
        <Pressable
          onPress={onDiscard}
          accessibilityRole="button"
          accessibilityLabel={`Discard ${title}`}
          hitSlop={spacing.sm}
          style={styles.action}
        >
          <AppText variant="buttonXs" color="dangerText">
            Discard
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: sizes.queueRow,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  divider: { borderBottomWidth: sizes.borderWidth, borderBottomColor: colors.border },
  texts: { flex: 1, marginRight: spacing.md },
  action: { marginLeft: spacing.md },
});
