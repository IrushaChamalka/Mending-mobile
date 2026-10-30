import type { JSX } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, sizes, spacing } from '@/shared/theme';
import { AppText, Icon } from '@/shared/ui';

export interface AvailableBalanceCardProps {
  /** "LKR 15,560". */
  amount: string;
  testID?: string;
}

/** The teal "Available to withdraw" card (E 5.1). */
export function AvailableBalanceCard({ amount, testID }: AvailableBalanceCardProps): JSX.Element {
  return (
    <View style={styles.card} testID={testID}>
      <Icon name="wallet" size="md" color="primary" style={styles.icon} />
      <View style={styles.texts}>
        <AppText variant="caption" color="primaryStrong">
          Available to withdraw
        </AppText>
        <AppText variant="title" color="primaryStrong" numberOfLines={1}>
          {amount}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + spacing.xxs,
    borderRadius: radius.lg,
    borderWidth: sizes.borderWidth,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySurface,
  },
  icon: { marginRight: spacing.md },
  texts: { flex: 1 },
});
