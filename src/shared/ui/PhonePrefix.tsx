import type { JSX } from 'react';
import { StyleSheet, View } from 'react-native';

import { COUNTRY_DIAL_CODE } from '@/shared/config/locale';
import { colors, sizes, spacing } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

/**
 * 🇱🇰 +94 prefix with divider, as drawn on the login screen. Single country, so not interactive. Pass
 * it as a TextField or FormTextField `prefix`.
 */
export function PhonePrefix(): JSX.Element {
  return (
    <View style={styles.prefix}>
      <AppText variant="listTitle">🇱🇰</AppText>
      <AppText variant="listTitle" style={styles.code}>
        {COUNTRY_DIAL_CODE}
      </AppText>
      <Icon name="chevron-down" size="xs" color="textPlaceholder" />
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  prefix: { flexDirection: 'row', alignItems: 'center' },
  code: { marginHorizontal: spacing.xs },
  divider: {
    width: sizes.borderWidth,
    height: sizes.inputDivider,
    backgroundColor: colors.border,
    marginLeft: spacing.md,
  },
});
