import type { JSX } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { AppText, Card } from '@/shared/ui';

export interface WithdrawalSummaryCardsProps {
  /** "LKR 10,000". */
  withdrawn: string;
  pending: string;
}

/** The "Withdrawn" and amber "Pending" totals, side by side (E 5.5). */
export function WithdrawalSummaryCards({
  withdrawn,
  pending,
}: WithdrawalSummaryCardsProps): JSX.Element {
  return (
    <View style={styles.row}>
      <Card style={styles.card} testID="withdrawn-total">
        <AppText variant="caption" color="textSecondary">
          Withdrawn
        </AppText>
        <AppText variant="cardTitle" numberOfLines={1} adjustsFontSizeToFit>
          {withdrawn}
        </AppText>
      </Card>
      <Card style={styles.card} testID="pending-total">
        <AppText variant="caption" color="textSecondary">
          Pending
        </AppText>
        <AppText variant="cardTitle" color="warningText" numberOfLines={1} adjustsFontSizeToFit>
          {pending}
        </AppText>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  card: { flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.md },
});
