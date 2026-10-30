import { memo, type JSX } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing, type StatusTone } from '@/shared/theme';
import { AppText, Badge, Card, Icon } from '@/shared/ui';

import type { DueLabel, TaskBadge } from '../domain/taskStatus';
import type { Task } from '../types';

export interface TaskCardProps {
  task: Task;
  badge: TaskBadge;
  due: DueLabel;
  /** Replaces the status pill while a submission is on its way ("Submitting", "Upload failed"). */
  uploadBadge?: { label: string; tone: StatusTone } | null;
  onPress: (taskId: string) => void;
  testID?: string;
}

/** A task in a list (E 2.1, E 3.1): order and pill, the work, then location and due day. */
function TaskCardView({
  task,
  badge,
  due,
  uploadBadge,
  onPress,
  testID,
}: TaskCardProps): JSX.Element {
  const pill = uploadBadge ?? badge;
  const heading = task.orderNumber ?? task.customerName ?? 'Task';
  return (
    <Card
      tone={due.isOverdue ? 'danger' : 'default'}
      onPress={() => {
        onPress(task.id);
      }}
      accessibilityLabel={`${heading}. ${task.title}. ${pill.label}. ${due.label}.`}
      testID={testID}
    >
      <View style={styles.headingRow}>
        <AppText variant="listTitle" weight="bold" numberOfLines={1} style={styles.heading}>
          {heading}
        </AppText>
        <Badge label={pill.label} tone={pill.tone} dot />
      </View>
      <AppText variant="subtitle" color="textBody" numberOfLines={1} style={styles.title}>
        {task.title}
      </AppText>
      <View style={styles.metaRow}>
        {task.location ? (
          <View style={styles.meta}>
            <Icon name="map-pin" size="xs" color="textSecondary" />
            <AppText
              variant="label"
              weight="regular"
              color="textSecondary"
              numberOfLines={1}
              style={styles.metaText}
            >
              {task.location}
            </AppText>
          </View>
        ) : null}
        <View style={styles.meta}>
          <Icon name="clock" size="xs" color={due.isOverdue ? 'danger' : 'textSecondary'} />
          <AppText
            variant="label"
            weight={due.isOverdue ? 'semibold' : 'regular'}
            color={due.isOverdue ? 'danger' : 'textSecondary'}
            numberOfLines={1}
            style={styles.metaText}
          >
            {due.label}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

/** Memoised: list cells re-render only when their task or flags change (brief §15). */
export const TaskCard = memo(TaskCardView);

const styles = StyleSheet.create({
  headingRow: { flexDirection: 'row', alignItems: 'center' },
  heading: { flex: 1, marginRight: spacing.md },
  title: { marginTop: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.lg },
  meta: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  metaText: { marginLeft: spacing.xs + spacing.xxs, flexShrink: 1 },
});
