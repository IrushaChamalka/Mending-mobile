import { Image, type ImageSource } from 'expo-image';
import type { JSX } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, sizes, spacing } from '@/shared/theme';

import { AppText } from './AppText';
import { Card } from './Card';
import { Icon } from './Icon';

export type PhotoSource = ImageSource | number | string | null | undefined;

export interface PhotoFrameProps {
  source?: PhotoSource;
  /** Shown under the placeholder icon when there is no photo. */
  caption?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** 350 × 250 photo frame (aspect 1.4) with the slate placeholder from M 4.2. */
export function PhotoFrame({ source, caption, style, testID }: PhotoFrameProps): JSX.Element {
  return (
    <View style={[styles.frame, style]} testID={testID}>
      {source ? (
        <Image
          source={source}
          style={styles.fill}
          contentFit="cover"
          accessibilityLabel="Captured photo"
        />
      ) : (
        <View style={styles.placeholder}>
          <Icon name="image" size="xxl" color="textPlaceholder" />
          {caption ? (
            <AppText variant="label" weight="regular" color="textSecondary" style={styles.caption}>
              {caption}
            </AppText>
          ) : null}
        </View>
      )}
    </View>
  );
}

export interface PhotoThumbnailRowProps {
  source?: PhotoSource;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Card row with a 52 dp thumbnail, title, subtitle and an action link (M 4.3 "Change"). */
export function PhotoThumbnailRow({
  source,
  title,
  subtitle,
  actionLabel,
  onAction,
  style,
  testID,
}: PhotoThumbnailRowProps): JSX.Element {
  return (
    <Card padded={false} style={[styles.card, style]} testID={testID}>
      <View style={styles.row}>
        <View style={styles.thumbnail}>
          {source ? <Image source={source} style={styles.fill} contentFit="cover" /> : null}
        </View>
        <View style={styles.texts}>
          <AppText variant="bodyStrong" weight="bold" numberOfLines={1}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color="textSecondary" numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            hitSlop={spacing.sm}
          >
            <AppText variant="bodyStrong" color="primary">
              {actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: sizes.photoAspectRatio,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceSunken,
    overflow: 'hidden',
  },
  fill: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  caption: { marginTop: spacing.md },
  card: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  thumbnail: {
    width: sizes.thumbnail,
    height: sizes.thumbnail,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSunken,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  texts: { flex: 1, marginRight: spacing.md },
});
