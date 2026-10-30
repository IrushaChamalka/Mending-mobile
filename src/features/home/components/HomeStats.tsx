import type { JSX } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { StatTile } from '@/shared/ui';

export interface HomeStatsProps {
  items: string;
  accepted: string;
  estimatedEarnings: string;
}

/** Items, Accepted and Est. earnings for this month (E 2.1). */
export function HomeStats({ items, accepted, estimatedEarnings }: HomeStatsProps): JSX.Element {
  return (
    <View style={styles.row}>
      <StatTile label="Items" value={items} tone="outlined" size="md" />
      <StatTile label="Accepted" value={accepted} tone="outlined" size="md" valueColor="success" />
      <StatTile
        label="Est. earnings"
        value={estimatedEarnings}
        tone="outlined"
        size="md"
        valueColor="textBody"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm + spacing.xxs },
});
