import type { JSX } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { spacing } from '@/shared/theme';

import { Banner } from './Banner';

export interface NetworkBannerProps {
  /** True when the device is offline (`useIsOnline`). */
  visible: boolean;
  pendingCount?: number;
  style?: StyleProp<ViewStyle>;
}

/** The amber "You are offline" notice from the sync center, shown under the header. */
export function NetworkBanner({
  visible,
  pendingCount = 0,
  style,
}: NetworkBannerProps): JSX.Element | null {
  if (!visible) return null;
  const message =
    pendingCount > 0
      ? `${pendingCount} ${pendingCount === 1 ? 'submission is' : 'submissions are'} saved on this device and will upload when you are back online.`
      : 'Submissions are stored on this device and upload automatically when you are back online.';
  return (
    <Banner
      tone="warning"
      icon="cloud-off"
      title="You are offline"
      message={message}
      style={[styles.container, style]}
    />
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: spacing.xl, marginTop: spacing.lg },
});
