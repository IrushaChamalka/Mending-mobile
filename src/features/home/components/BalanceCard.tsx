import { LinearGradient } from 'expo-linear-gradient';
import type { JSX } from 'react';
import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme';
import { AppText, Button, type IconName } from '@/shared/ui';

export interface BalanceCardProps {
  /** "LKR 15,560". */
  balance: string;
  /** "Approved 25,560 – withdrawn 10,000". */
  breakdown: string;
  actionLabel: string;
  actionIcon: IconName;
  onAction: () => void;
}

const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 1, y: 1 };

/** The teal balance card with its withdrawal button (E 2.1). */
export function BalanceCard({
  balance,
  breakdown,
  actionLabel,
  actionIcon,
  onAction,
}: BalanceCardProps): JSX.Element {
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={GRADIENT_START}
      end={GRADIENT_END}
      style={styles.card}
    >
      <AppText variant="label" weight="regular" color="onPrimaryMuted">
        Available to withdraw
      </AppText>
      <AppText variant="amount" color="primaryText" style={styles.balance} testID="home-balance">
        {balance}
      </AppText>
      <AppText variant="label" weight="regular" color="onPrimaryMuted">
        {breakdown}
      </AppText>
      <Button
        title={actionLabel}
        leftIcon={actionIcon}
        variant="inverse"
        size="md"
        onPress={onAction}
        style={styles.action}
        testID="home-withdraw"
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl + spacing.xs, padding: spacing.lg + spacing.xxs },
  balance: { marginTop: spacing.xs, marginBottom: spacing.xs },
  action: { marginTop: spacing.md },
});
