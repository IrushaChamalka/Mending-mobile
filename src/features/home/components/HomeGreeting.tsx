import type { JSX, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, sizes, spacing } from '@/shared/theme';
import { AppText, Avatar } from '@/shared/ui';

export interface HomeGreetingProps {
  greeting: string;
  name: string;
  imageUrl: string | null;
  /** Right slot, the sync pill. */
  right?: ReactNode;
}

/** The Home header (E 2.1): avatar, "Good morning," and the employee's name. */
export function HomeGreeting({ greeting, name, imageUrl, right }: HomeGreetingProps): JSX.Element {
  return (
    <View style={styles.bar}>
      <Avatar name={name} size="md" imageUrl={imageUrl} />
      <View style={styles.texts}>
        <AppText variant="label" weight="regular" color="textSecondary">
          {greeting}
        </AppText>
        <AppText variant="heading" numberOfLines={1}>
          {name}
        </AppText>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: sizes.headerBar,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: sizes.borderWidth,
    borderBottomColor: colors.border,
  },
  texts: { flex: 1, marginLeft: spacing.md },
  right: { marginLeft: spacing.md },
});
