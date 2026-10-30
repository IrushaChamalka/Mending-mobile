import type { JSX } from 'react';
import type { Control } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { Banner, Card, FormTextField, PhotoThumbnailRow, StatTile } from '@/shared/ui';

import {
  QUANTITY_MAX_DIGITS,
  type SubmitFormInput,
  type SubmitFormValues,
} from '../data/submitForm';

export interface SubmitFormProps {
  control: Control<SubmitFormInput, unknown, SubmitFormValues>;
  photoUri: string;
  photoSubtitle: string;
  targetLabel: string;
  dueLabel: string;
  noteMaxLength: number;
  submitError: string | null;
  isOnline: boolean;
  onChangePhoto: () => void;
  onCompletedSubmitEditing: () => void;
  onAcceptedSubmitEditing: () => void;
}

/**
 * M 4.3 adapted: summary tiles, the backend's fields (completed pieces, optional accepted pieces,
 * optional note) in place of the member table, then the attached-photo card with "Change".
 */
export function SubmitForm({
  control,
  photoUri,
  photoSubtitle,
  targetLabel,
  dueLabel,
  noteMaxLength,
  submitError,
  isOnline,
  onChangePhoto,
  onCompletedSubmitEditing,
  onAcceptedSubmitEditing,
}: SubmitFormProps): JSX.Element {
  return (
    <View style={styles.content}>
      {submitError ? (
        <Banner variant="alert" tone="danger" message={submitError} testID="submit-error" />
      ) : null}
      <Card>
        <View style={styles.tiles}>
          <StatTile label="Target" value={targetLabel} style={styles.tile} />
          <View style={styles.tileGap} />
          <StatTile label="Due" value={dueLabel} style={styles.tile} />
        </View>
      </Card>
      <Card>
        <FormTextField
          control={control}
          name="completedQuantity"
          label="Completed pieces"
          placeholder="0"
          keyboardType="number-pad"
          valueStyle
          maxLength={QUANTITY_MAX_DIGITS}
          returnKeyType="next"
          onSubmitEditing={onCompletedSubmitEditing}
          submitBehavior="submit"
          testID="submit-completed"
        />
        <FormTextField
          control={control}
          name="acceptedQuantity"
          label="Accepted pieces (optional)"
          helper="Pieces that passed the quality check, if you know it."
          placeholder="0"
          keyboardType="number-pad"
          valueStyle
          maxLength={QUANTITY_MAX_DIGITS}
          returnKeyType="next"
          onSubmitEditing={onAcceptedSubmitEditing}
          submitBehavior="submit"
          containerStyle={styles.field}
          testID="submit-accepted"
        />
        <FormTextField
          control={control}
          name="note"
          label="Note (optional)"
          placeholder="Anything your supervisor should know"
          multiline
          maxLength={noteMaxLength}
          showCount
          containerStyle={styles.field}
          testID="submit-note"
        />
      </Card>
      <PhotoThumbnailRow
        source={photoUri}
        title="Tally sheet photo"
        subtitle={photoSubtitle}
        actionLabel="Change"
        onAction={onChangePhoto}
      />
      <Banner
        tone={isOnline ? 'info' : 'warning'}
        icon={isOnline ? 'info' : 'cloud-off'}
        message={
          isOnline
            ? 'Saved on this device first. It uploads automatically when online.'
            : "You're offline. It's saved on this device and uploads automatically when you're back online."
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.lg },
  tiles: { flexDirection: 'row' },
  tile: { flex: 1 },
  tileGap: { width: spacing.sm },
  field: { marginTop: spacing.lg },
});
