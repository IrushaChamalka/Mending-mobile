import type { JSX } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { TaskCard } from '@/features/tasks';
import { colors, spacing } from '@/shared/theme';
import {
  Banner,
  EmptyState,
  ErrorState,
  Loader,
  NetworkBanner,
  Screen,
  SectionHeader,
  SyncStatusPill,
} from '@/shared/ui';

import { BalanceCard } from '../components/BalanceCard';
import { HomeGreeting } from '../components/HomeGreeting';
import { HomeStats } from '../components/HomeStats';
import { useHomeViewModel } from '../hooks/useHomeViewModel';

/** Home (E 2.1). */
export default function HomeScreen(): JSX.Element {
  const viewModel = useHomeViewModel();
  const { syncPill } = viewModel;

  return (
    <Screen
      scroll
      padded
      bottomInset={false}
      header={
        <HomeGreeting
          greeting={viewModel.greeting}
          name={viewModel.name}
          imageUrl={viewModel.imageUrl}
          right={
            <SyncStatusPill
              status={syncPill.status}
              pendingCount={syncPill.pendingCount}
              failedCount={syncPill.failedCount}
              onPress={viewModel.openSyncCenter}
            />
          }
        />
      }
      refreshControl={
        <RefreshControl
          refreshing={viewModel.isRefreshing}
          onRefresh={viewModel.refresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.content}>
        <NetworkBanner visible={!viewModel.isOnline} pendingCount={syncPill.pendingCount} />
        <BalanceCard
          balance={viewModel.balance}
          breakdown={viewModel.breakdown}
          actionLabel={viewModel.withdrawLabel}
          actionIcon={viewModel.withdrawIcon}
          onAction={viewModel.openWithdraw}
        />
        {viewModel.earningsUnavailable ? (
          <Banner
            variant="alert"
            tone="warning"
            message="Couldn't load your earnings. Pull down to try again."
          />
        ) : null}
        <HomeStats
          items={viewModel.stats.items}
          accepted={viewModel.stats.accepted}
          estimatedEarnings={viewModel.stats.estimatedEarnings}
        />
        <SectionHeader
          title="Today's tasks"
          actionLabel="See all"
          onAction={viewModel.seeAllTasks}
          style={styles.sectionHeader}
        />
        {viewModel.tasksState === 'loading' ? <Loader label="Loading your tasks" /> : null}
        {viewModel.tasksState === 'waitingForNetwork' ? (
          <EmptyState
            icon="cloud-off"
            title="You're offline"
            body="Your tasks will load when you're back online."
          />
        ) : null}
        {viewModel.tasksState === 'error' ? <ErrorState onRetry={viewModel.retryTasks} /> : null}
        {viewModel.tasksState === 'ready' && viewModel.todaysTasks.length === 0 ? (
          <EmptyState
            icon="check-circle"
            title="Nothing due today"
            body="Tasks due today and anything overdue will show here."
          />
        ) : null}
        {viewModel.todaysTasks.map((item) => (
          <TaskCard
            key={item.task.id}
            task={item.task}
            badge={item.badge}
            due={item.due}
            uploadBadge={item.uploadBadge}
            onPress={viewModel.openTask}
            testID={`home-task-${item.task.id}`}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md + spacing.xxs, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  sectionHeader: { marginTop: spacing.sm },
});
