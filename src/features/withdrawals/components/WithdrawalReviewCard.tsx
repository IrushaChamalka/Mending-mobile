import type { JSX } from 'react';
import { StyleSheet } from 'react-native';

import { spacing } from '@/shared/theme';
import { AppText, Card, Divider } from '@/shared/ui';

import { DetailRows, type DetailRow } from './DetailRows';

export interface WithdrawalReviewCardProps {
  /** "LKR 10,000". */
  amount: string;
  rows: readonly DetailRow[];
  testID?: string;
}

/** "You are withdrawing", the amount, then the request's details (E 5.3). */
export function WithdrawalReviewCard({
  amount,
  rows,
  testID,
}: WithdrawalReviewCardProps): JSX.Element {
  return (
    <Card testID={testID}>
      <AppText variant="caption" color="textSecondary" align="center">
        You are withdrawing
      </AppText>
      <AppText
        variant="amount"
        color="primary"
        align="center"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={styles.amount}
      >
        {amount}
      </AppText>
      <Divider style={styles.divider} />
      <DetailRows rows={rows} />
    </Card>
  );
}

const styles = StyleSheet.create({
  amount: { marginTop: spacing.xs },
  divider: { marginVertical: spacing.lg },
});
