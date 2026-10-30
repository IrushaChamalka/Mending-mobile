import type { JSX } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, spacing } from '@/shared/theme';

import { AppText } from './AppText';

export interface LoaderProps {
  size?: 'small' | 'large';
  label?: string;
  /** Centres the spinner in all available space. */
  fullScreen?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Loader({
  size = 'large',
  label,
  fullScreen = false,
  style,
  testID,
}: LoaderProps): JSX.Element {
  return (
    <View style={[styles.container, fullScreen ? styles.fullScreen : null, style]} testID={testID}>
      <ActivityIndicator size={size} color={colors.primary} />
      {label ? (
        <AppText variant="caption" color="textSecondary" style={styles.label}>
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  fullScreen: { flex: 1 },
  label: { marginTop: spacing.sm },
});
