import type { JSX } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme';
import { AppText, Card, Divider } from '@/shared/ui';

export interface EarningsSummaryCardProps {
  estimated: string;
  approved: string;
  /** "− LKR 10,000". */
  withdrawn: string;
  available: string;
}

/** Estimated, approved, withdrawn and available (E 4.1). */
export function EarningsSummaryCard({
  estimated,
  approved,
  withdrawn,
  available,
}: EarningsSummaryCardProps): JSX.Element {
  return (
    <Card testID="earnings-summary">
      <View style={styles.row}>
        <View style={styles.labels}>
          <AppText variant="body" color="textBody">
            Estimated earnings
          </AppText>
          <AppText variant="caption" color="textSecondary">
            Awaiting approval
          </AppText>
        </View>
        <AppText variant="value" color="textBody">
          {estimated}
        </AppText>
      </View>
      <View style={[styles.row, styles.approvedRow]}>
        <View style={styles.labels}>
          <AppText variant="body" color="textBody">
            Approved earnings
          </AppText>
          <AppText variant="caption" color="textSecondary">
            Ready to withdraw
          </AppText>
        </View>
        <AppText variant="stat" color="success">
          {approved}
        </AppText>
      </View>
      <Divider style={styles.divider} />
      <View style={styles.row}>
        <AppText variant="body" color="textSecondary" style={styles.labels}>
          Already withdrawn
        </AppText>
        <AppText variant="bodyStrong">{withdrawn}</AppText>
      </View>
      <View style={styles.available}>
        <AppText variant="listTitle" weight="bold" color="primaryStrong" style={styles.labels}>
          Available
        </AppText>
        <AppText variant="stat" color="primaryStrong" testID="earnings-available">
          {available}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  labels: { flex: 1, marginRight: spacing.md },
  approvedRow: { marginTop: spacing.md },
  divider: { marginVertical: spacing.md },
  available: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySurface,
  },
});
