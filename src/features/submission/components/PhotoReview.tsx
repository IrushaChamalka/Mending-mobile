import type { JSX } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { AppText, Button, PhotoFrame } from '@/shared/ui';

export interface PhotoReviewProps {
  photoUri: string;
  onRetake: () => void;
  onConfirm: () => void;
}

/** The captured photo in the 350 × 250 frame of M 4.2, with Retake and Use photo. */
export function PhotoReview({ photoUri, onRetake, onConfirm }: PhotoReviewProps): JSX.Element {
  return (
    <View>
      <AppText variant="heading">Tally sheet photo</AppText>
      <AppText variant="bodySmall" color="textSecondary" style={styles.description}>
        Check that every count on the sheet is sharp and readable. Retake it if anything is cut off
        or blurry.
      </AppText>
      <PhotoFrame source={photoUri} style={styles.frame} testID="capture-preview" />
      <View style={styles.actions}>
        <Button
          title="Retake"
          variant="outline"
          size="md"
          leftIcon="camera"
          onPress={onRetake}
          style={styles.action}
          testID="capture-retake"
        />
        <View style={styles.gap} />
        <Button
          title="Use photo"
          size="md"
          leftIcon="check"
          onPress={onConfirm}
          style={styles.action}
          testID="capture-use"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  description: { marginTop: spacing.md },
  frame: { marginTop: spacing.lg },
  actions: { flexDirection: 'row', marginTop: spacing.lg },
  action: { flex: 1 },
  gap: { width: spacing.md },
});
