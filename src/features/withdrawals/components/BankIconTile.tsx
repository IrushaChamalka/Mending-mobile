import type { JSX } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, sizes } from '@/shared/theme';
import { Icon } from '@/shared/ui';

/** The bank glyph on a 40 dp blue tile (E 5.1 "Payout to"). */
export function BankIconTile(): JSX.Element {
  return (
    <View style={styles.tile}>
      <Icon name="bank" size="md" color="info" />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: sizes.iconTile,
    height: sizes.iconTile,
    borderRadius: radius.sm,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
