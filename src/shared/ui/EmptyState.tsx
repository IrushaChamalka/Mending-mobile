import type { JSX } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, sizes, spacing } from '@/shared/theme';

import { AppText } from './AppText';
import { Button, type ButtonVariant } from './Button';
import { Icon, type IconName } from './Icon';

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: ButtonVariant;
  tone?: 'default' | 'danger';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Centred icon tile, title, body and optional action. Not designed; follows the card and tile styles. */
export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
  actionVariant = 'primary',
  tone = 'default',
  style,
  testID,
}: EmptyStateProps): JSX.Element {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={[styles.tile, tone === 'danger' ? styles.tileDanger : null]}>
        <Icon name={icon} size="lg" color={tone === 'danger' ? 'danger' : 'primary'} />
      </View>
      <AppText variant="heading" align="center" style={styles.title}>
        {title}
      </AppText>
      {body ? (
        <AppText variant="body" color="textSecondary" align="center">
          {body}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant={actionVariant}
          size="md"
          fullWidth={false}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  tile: {
    width: sizes.iconTile,
    height: sizes.iconTile,
    borderRadius: radius.md,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  tileDanger: { backgroundColor: colors.dangerSurface },
  title: { marginBottom: spacing.xs },
  action: { marginTop: spacing.xl },
});
