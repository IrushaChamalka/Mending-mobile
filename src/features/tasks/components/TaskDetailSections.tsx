import { Image } from 'expo-image';
import type { JSX } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, sizes, spacing } from '@/shared/theme';
import { AppText, Banner, Card, Icon, SectionHeader, StatTile } from '@/shared/ui';
import { formatCount } from '@/shared/utils/number';

import type { ProgressCounts } from '../domain/taskRules';
import type { TaskReview } from '../types';

export interface TaskFact {
  label: string;
  value: string;
  /** Red value, e.g. an overdue due date. */
  isAlert?: boolean;
}

export interface TaskFactsCardProps {
  /** "Mending · 120 garments". */
  title: string;
  facts: readonly TaskFact[];
}

/** The work and its label / value rows (E 3.2): Location, Due, Style, Sizes. */
export function TaskFactsCard({ title, facts }: TaskFactsCardProps): JSX.Element {
  return (
    <Card>
      <AppText variant="heading" style={styles.factsTitle}>
        {title}
      </AppText>
      {facts.map((fact) => (
        <View key={fact.label} style={styles.factRow}>
          <AppText variant="body" color="textSecondary">
            {fact.label}
          </AppText>
          <AppText
            variant="bodyStrong"
            color={fact.isAlert ? 'danger' : 'textPrimary'}
            align="right"
            numberOfLines={2}
            style={styles.factValue}
          >
            {fact.value}
          </AppText>
        </View>
      ))}
    </Card>
  );
}

export interface TaskInstructionsProps {
  text: string;
}

/** The assigner's note in the amber box (E 3.2). */
export function TaskInstructions({ text }: TaskInstructionsProps): JSX.Element {
  return <Banner tone="warning" icon={null} title="Instructions" message={text} />;
}

export interface TaskPhotosProps {
  /** Photo URLs (the submitted tally sheet). */
  photos: readonly string[];
}

/** Photo tiles (E 3.2). The backend keeps one photo per task: the signed tally sheet. */
export function TaskPhotos({ photos }: TaskPhotosProps): JSX.Element {
  return (
    <View style={styles.photoRow}>
      {photos.map((uri) => (
        <View key={uri} style={styles.photoTile}>
          <Icon name="image" size="lg" color="textPlaceholder" />
          <Image
            source={{ uri }}
            style={styles.photoImage}
            contentFit="cover"
            accessibilityLabel="Submitted tally sheet photo"
          />
        </View>
      ))}
    </View>
  );
}

export interface TaskProgressTilesProps {
  counts: ProgressCounts;
}

function countLabel(value: number | null): string {
  return value === null ? '–' : formatCount(value);
}

/** "My progress" (E 3.2): reported, accepted and not-accepted pieces. */
export function TaskProgressTiles({ counts }: TaskProgressTilesProps): JSX.Element {
  return (
    <View>
      <SectionHeader title="My progress" style={styles.progressTitle} />
      <View style={styles.tiles}>
        <StatTile label="Done" value={countLabel(counts.done)} tone="brand" size="md" />
        <StatTile label="Accepted" value={countLabel(counts.accepted)} tone="success" size="md" />
        <StatTile label="Rejected" value={countLabel(counts.rejected)} tone="danger" size="md" />
      </View>
    </View>
  );
}

export interface TaskReviewNoticeProps {
  review: TaskReview;
}

/** The supervisor's review: how many pieces were accepted, and their note. */
export function TaskReviewNotice({ review }: TaskReviewNoticeProps): JSX.Element {
  const allAccepted = review.acceptedQuantity >= review.completedQuantity;
  const summary = allAccepted
    ? `All ${formatCount(review.completedQuantity)} pieces accepted.`
    : `${formatCount(review.acceptedQuantity)} of ${formatCount(review.completedQuantity)} pieces accepted.`;
  return (
    <Banner
      tone={allAccepted ? 'success' : 'warning'}
      icon={allAccepted ? 'check' : 'alert-circle'}
      title="Reviewed by your supervisor"
      message={review.notes ? `${summary}\n${review.notes}` : summary}
    />
  );
}

const styles = StyleSheet.create({
  factsTitle: { marginBottom: spacing.sm },
  factRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + spacing.xxs,
  },
  factValue: { flex: 1, marginLeft: spacing.lg },
  photoRow: { flexDirection: 'row', gap: spacing.md - spacing.xxs },
  photoTile: {
    width: sizes.photoTile,
    height: sizes.photoTile,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: { ...StyleSheet.absoluteFill },
  progressTitle: { marginBottom: spacing.md },
  tiles: { flexDirection: 'row', gap: spacing.sm },
});
