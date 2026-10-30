import type { JSX } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { AppText, Card, Icon } from '@/shared/ui';

import { BankIconTile } from './BankIconTile';

export interface PayoutToCardProps {
  /** "Bank of Ceylon ···· 4421". */
  title: string;
  /** "Kasun Fernando · verified". */
  subtitle: string;
  onPress: () => void;
  testID?: string;
}

/** The "Payout to" card (E 5.1), opening the account's details. */
export function PayoutToCard({ title, subtitle, onPress, testID }: PayoutToCardProps): JSX.Element {
  return (
    <Card onPress={onPress} accessibilityLabel={`Payout to ${title}, ${subtitle}`} testID={testID}>
      <AppText variant="caption" color="textSecondary">
        Payout to
      </AppText>
      <View style={styles.row}>
        <BankIconTile />
        <View style={styles.texts}>
          <AppText variant="listTitle" weight="bold" numberOfLines={1}>
            {title}
          </AppText>
          <AppText variant="caption" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </AppText>
        </View>
        <Icon name="chevron-right" size="sm" color="textPlaceholder" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  texts: { flex: 1 },
});
