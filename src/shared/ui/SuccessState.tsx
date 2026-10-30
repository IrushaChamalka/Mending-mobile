import type { JSX } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, sizes, spacing, type StatusTone } from '@/shared/theme';

import { AppText } from './AppText';
import { Badge } from './Badge';
import { Icon } from './Icon';

export interface SuccessStateProps {
  title: string;
  lines?: string[];
  badge?: { label: string; tone: StatusTone };
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Green ring + disc + check with a title, body lines and a pill (M 4.4 Submitted). */
export function SuccessState({
  title,
  lines = [],
  badge,
  style,
  testID,
}: SuccessStateProps): JSX.Element {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.ring}>
        <View style={styles.disc}>
          <Icon name="check" size="xl" color="primaryText" />
        </View>
      </View>
      <AppText variant="stat" align="center" style={styles.title}>
        {title}
      </AppText>
      {lines.map((line) => (
        <AppText key={line} variant="body" color="textSecondary" align="center">
          {line}
        </AppText>
      ))}
      {badge ? <Badge label={badge.label} tone={badge.tone} dot style={styles.badge} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    width: sizes.successRing,
    height: sizes.successRing,
    borderRadius: radius.full,
    backgroundColor: colors.successRing,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  disc: {
    width: sizes.successDisc,
    height: sizes.successDisc,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginBottom: spacing.md },
  badge: { marginTop: spacing.lg, alignSelf: 'center' },
});
