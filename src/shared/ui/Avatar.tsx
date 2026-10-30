import { Image } from 'expo-image';
import type { JSX } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, sizes, type TextVariant } from '@/shared/theme';
import { getInitials } from '@/shared/utils/initials';

import { AppText } from './AppText';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  name: string;
  /** sm 40 · md 44 · lg 68 · xl 84 */
  size?: AvatarSize;
  imageUrl?: string | null;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const textVariantBySize: Record<AvatarSize, TextVariant> = {
  sm: 'listTitle',
  md: 'cardTitle',
  lg: 'stat',
  xl: 'display',
};

/** Initials on teal-100, or the profile image when one exists. */
export function Avatar({ name, size = 'sm', imageUrl, style, testID }: AvatarProps): JSX.Element {
  return (
    <View style={[styles.base, sizeStyles[size], style]} testID={testID} accessibilityLabel={name}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, sizeStyles[size]]}
          contentFit="cover"
        />
      ) : (
        <AppText variant={textVariantBySize[size]} weight="bold" color="primary">
          {getInitials(name)}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { borderRadius: radius.full },
});

// Plain dimensions so the same object fits both the View and the expo-image style types.
const sizeStyles: Record<AvatarSize, { width: number; height: number }> = {
  sm: { width: sizes.avatarSm, height: sizes.avatarSm },
  md: { width: sizes.avatarMd, height: sizes.avatarMd },
  lg: { width: sizes.avatarLg, height: sizes.avatarLg },
  xl: { width: sizes.avatarXl, height: sizes.avatarXl },
};
