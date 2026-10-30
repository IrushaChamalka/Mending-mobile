import type { JSX, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, sizes, spacing } from '@/shared/theme';

import { AppText } from './AppText';
import { IconButton } from './IconButton';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  /** Renders the 40 dp back button. */
  onBack?: () => void;
  /** Right slot, usually a SyncStatusPill. */
  right?: ReactNode;
  testID?: string;
}

/** 64 dp app header with a bottom hairline, in root and back variants. */
export function Header({ title, subtitle, onBack, right, testID }: HeaderProps): JSX.Element {
  // A title on its own makes a shorter bar (M 6.2: 47 dp); with a subtitle or back button it is 64.
  const isCompact = !subtitle && !onBack;
  return (
    <View style={[styles.bar, isCompact ? styles.compact : null]} testID={testID}>
      {onBack ? (
        <IconButton
          icon="arrow-left"
          variant="muted"
          onPress={onBack}
          accessibilityLabel="Go back"
          style={styles.back}
        />
      ) : null}
      <View style={styles.titles}>
        <AppText variant="title" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: sizes.headerBar,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: sizes.borderWidth,
    borderBottomColor: colors.border,
  },
  compact: {
    minHeight: 0,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md + spacing.xxs,
  },
  back: { marginRight: spacing.md },
  titles: { flex: 1 },
  right: { marginLeft: spacing.md },
});
