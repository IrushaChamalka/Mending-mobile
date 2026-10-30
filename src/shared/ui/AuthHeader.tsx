import type { JSX, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, sizes, spacing } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

export interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  /** Logo tile + wordmark (login). Mutually exclusive with onBack. */
  brand?: boolean;
  onBack?: () => void;
}

/** Content block drawn on the auth gradient: brand row or back button, then title and subtitle. */
export function AuthHeader({
  title,
  subtitle,
  brand = false,
  onBack,
}: AuthHeaderProps): JSX.Element {
  return (
    <View style={styles.container}>
      {brand ? (
        <View style={styles.brandRow}>
          <View style={styles.logoTile}>
            {/* TODO: replace with the exported StitchFlow mark (assets/logo-mark.svg) when available. */}
            <Icon name="edit-3" size="md" color="primary" />
          </View>
          <AppText variant="value" color="primaryText" style={styles.wordmark}>
            StitchFlow
          </AppText>
        </View>
      ) : onBack ? (
        <IconButton
          icon="arrow-left"
          variant="overlay"
          onPress={onBack}
          accessibilityLabel="Go back"
          style={styles.back}
        />
      ) : null}
      <AppText variant="display" color="primaryText">
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="subtitle" color="onPrimaryMuted" style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

export interface AuthSheetProps {
  children: ReactNode;
}

/** The white sheet with 28 dp top corners that holds the auth form. */
export function AuthSheet({ children }: AuthSheetProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const bottomInset = { paddingBottom: Math.max(insets.bottom, spacing.lg) };
  return <View style={[styles.sheet, bottomInset]}>{children}</View>;
}

// Measured from M 1.1 / M 1.4: 8 dp between brand row, title and subtitle; 28 dp to the sheet;
// the sheet's first element starts 28 dp below its top edge.
const SHEET_GAP = spacing.xxl + spacing.xs;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: SHEET_GAP,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  logoTile: {
    width: sizes.logoTile,
    height: sizes.logoTile,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: { marginLeft: spacing.md },
  back: { marginBottom: spacing.sm },
  subtitle: { marginTop: spacing.sm },
  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.xxl,
    paddingTop: SHEET_GAP,
  },
});
