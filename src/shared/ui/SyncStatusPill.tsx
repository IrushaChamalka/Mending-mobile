import type { JSX } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { spacing } from '@/shared/theme';

import { Badge } from './Badge';

export type SyncStatus = 'synced' | 'pending' | 'offline' | 'failed';

export interface SyncStatusPillProps {
  status: SyncStatus;
  pendingCount?: number;
  failedCount?: number;
  /** Makes the pill a button, usually opening the sync center. */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

function labelFor(status: SyncStatus, pendingCount: number, failedCount: number): string {
  switch (status) {
    case 'synced':
      return 'All synced';
    case 'pending':
      return `${pendingCount} pending`;
    case 'failed':
      return `${failedCount} failed`;
    case 'offline':
      return pendingCount > 0 ? `Offline · ${pendingCount} pending` : 'Offline';
  }
}

const toneFor = {
  synced: 'success',
  pending: 'warning',
  offline: 'warning',
  failed: 'danger',
} as const;

/** Header pill: "All synced", "2 pending", "1 failed" or "Offline · 2 pending" (M 2.1, M 6.1). */
export function SyncStatusPill({
  status,
  pendingCount = 0,
  failedCount = 0,
  onPress,
  style,
}: SyncStatusPillProps): JSX.Element {
  const label = labelFor(status, pendingCount, failedCount);
  const pill = <Badge label={label} tone={toneFor[status]} dot style={onPress ? null : style} />;
  if (!onPress) return pill;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Opens the sync center.`}
      hitSlop={spacing.sm}
      style={style}
    >
      {pill}
    </Pressable>
  );
}
