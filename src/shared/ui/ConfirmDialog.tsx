import type { JSX } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme';

import { AppText } from './AppText';
import { Button } from './Button';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Soft-red confirm button for sign out, discard and similar. */
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
}

function swallowPress(): void {
  // Keeps taps inside the card from reaching the backdrop.
}

/** Centred confirmation card over a dimmed backdrop. Not designed; follows the card style. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
  testID,
}: ConfirmDialogProps): JSX.Element {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={loading ? swallowPress : onCancel}
    >
      <Pressable
        style={styles.backdrop}
        onPress={loading ? undefined : onCancel}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <Pressable style={styles.card} onPress={swallowPress} testID={testID}>
          <AppText variant="heading">{title}</AppText>
          {message ? (
            <AppText variant="body" color="textSecondary" style={styles.message}>
              {message}
            </AppText>
          ) : null}
          <View style={styles.actions}>
            <Button
              title={cancelLabel}
              variant="secondary"
              size="md"
              onPress={onCancel}
              disabled={loading}
              style={styles.action}
            />
            <View style={styles.gap} />
            <Button
              title={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              size="md"
              onPress={onConfirm}
              loading={loading}
              style={styles.action}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  message: { marginTop: spacing.sm },
  actions: { flexDirection: 'row', marginTop: spacing.xl },
  action: { flex: 1 },
  gap: { width: spacing.md },
});
