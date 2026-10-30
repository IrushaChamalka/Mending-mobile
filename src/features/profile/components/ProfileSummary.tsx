import type { JSX } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { AppText, Avatar, Badge } from '@/shared/ui';

export interface ProfileSummaryProps {
  name: string;
  roleLabel: string;
  imageUrl: string | null;
}

/** The 84 dp avatar, name and role pill of M 6.2. */
export function ProfileSummary({ name, roleLabel, imageUrl }: ProfileSummaryProps): JSX.Element {
  return (
    <View style={styles.container}>
      <Avatar name={name} size="xl" imageUrl={imageUrl} />
      <AppText variant="stat" align="center" numberOfLines={2} style={styles.name}>
        {name}
      </AppText>
      {roleLabel ? <Badge label={roleLabel} tone="brand" style={styles.role} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  name: { marginTop: spacing.sm },
  role: { marginTop: spacing.sm },
});
