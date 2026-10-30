import type { JSX } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { AppText, Badge, Card, Divider } from '@/shared/ui';

import { BankIconTile } from './BankIconTile';
import { DetailRows, type DetailRow } from './DetailRows';

export interface PayoutAccountDetailsProps {
  bankName: string;
  /** "Biyagama branch", or null when the bank has none on record. */
  branch: string | null;
  verified: boolean;
  rows: readonly DetailRow[];
  testID?: string;
}

/** The payout account, read-only (not designed; follows the E 5.1 "Payout to" card). */
export function PayoutAccountDetails({
  bankName,
  branch,
  verified,
  rows,
  testID,
}: PayoutAccountDetailsProps): JSX.Element {
  return (
    <Card testID={testID}>
      <View style={styles.top}>
        <BankIconTile />
        <View style={styles.texts}>
          <AppText variant="listTitle" weight="bold" numberOfLines={2}>
            {bankName}
          </AppText>
          {branch ? (
            <AppText variant="caption" color="textSecondary" numberOfLines={1}>
              {branch}
            </AppText>
          ) : null}
        </View>
        <Badge
          label={verified ? 'Verified' : 'Not verified'}
          tone={verified ? 'success' : 'warning'}
          dot
        />
      </View>
      <Divider style={styles.divider} />
      <DetailRows rows={rows} />
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  texts: { flex: 1 },
  divider: { marginVertical: spacing.lg },
});
