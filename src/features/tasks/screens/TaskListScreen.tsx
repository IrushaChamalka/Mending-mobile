import { FlashList } from '@shopify/flash-list';
import type { JSX } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/shared/theme';
import {
  Banner,
  EmptyState,
  ErrorState,
  Header,
  Loader,
  NetworkBanner,
  Screen,
  SyncStatusPill,
} from '@/shared/ui';

import { TaskCard } from '../components/TaskCard';
import { TaskFilterChips } from '../components/TaskFilterChips';
import { useTaskListViewModel, type TaskListItem } from '../hooks/useTaskListViewModel';

function keyExtractor(item: TaskListItem): string {
  return item.task.id;
}

function ItemGap(): JSX.Element {
  return <View style={styles.gap} />;
}

/** My tasks (E 3.1): the signed-in employee's daily assignments. */
export default function TaskListScreen(): JSX.Element {
  const viewModel = useTaskListViewModel();
  const { openTask } = viewModel;

  const renderItem = ({ item }: { item: TaskListItem }): JSX.Element => (
    <TaskCard
      task={item.task}
      badge={item.badge}
      due={item.due}
      uploadBadge={item.uploadBadge}
      onPress={openTask}
      testID={`task-card-${item.task.id}`}
    />
  );

  return (
    <Screen
      bottomInset={false}
      header={
        <Header
          title="My tasks"
          subtitle={viewModel.subtitle}
          right={
            <SyncStatusPill
              status={viewModel.syncPill.status}
              pendingCount={viewModel.syncPill.pendingCount}
              failedCount={viewModel.syncPill.failedCount}
              onPress={viewModel.openSyncCenter}
            />
          }
        />
      }
    >
      <NetworkBanner visible={!viewModel.isOnline} pendingCount={viewModel.unsentCount} />
      {viewModel.refreshFailed && viewModel.isOnline ? (
        <Banner
          variant="alert"
          tone="warning"
          message="Couldn't refresh. Showing your saved tasks."
          style={styles.notice}
        />
      ) : null}
      <TaskFilterChips
        options={viewModel.filterOptions}
        selected={viewModel.selectedFilter}
        onSelect={viewModel.selectFilter}
      />
      {viewModel.state === 'loading' ? <Loader fullScreen label="Loading your tasks" /> : null}
      {viewModel.state === 'waitingForNetwork' ? (
        <EmptyState
          icon="cloud-off"
          title="You're offline"
          body="Your tasks will load when you're back online."
        />
      ) : null}
      {viewModel.state === 'error' ? (
        <ErrorState message={viewModel.loadError?.message} onRetry={viewModel.retry} />
      ) : null}
      {viewModel.state === 'ready' ? (
        <FlashList
          data={viewModel.items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={ItemGap}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={viewModel.isRefreshing}
              onRefresh={viewModel.refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={viewModel.loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <EmptyState
              icon="clipboard"
              title={viewModel.empty.title}
              body={viewModel.empty.body}
            />
          }
          ListFooterComponent={viewModel.isLoadingMore ? <Loader size="small" /> : null}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: { marginHorizontal: spacing.xl, marginTop: spacing.lg },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  gap: { height: spacing.md },
});
