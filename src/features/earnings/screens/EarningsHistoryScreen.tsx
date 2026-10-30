import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams } from 'expo-router';
import type { JSX } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/shared/theme';
import {
  Chip,
  EmptyState,
  ErrorState,
  Header,
  Loader,
  Screen,
  SyncStatusPill,
  TableEmptyRow,
} from '@/shared/ui';

import {
  EarningsHistoryRow,
  EarningsSubtotalRow,
  EarningsTableHeader,
} from '../components/EarningsHistoryTable';
import {
  useEarningsHistoryViewModel,
  type EarningsHistoryItem,
} from '../hooks/useEarningsHistoryViewModel';

function keyExtractor(item: EarningsHistoryItem): string {
  return item.id;
}

function renderItem({ item }: { item: EarningsHistoryItem }): JSX.Element {
  return (
    <EarningsHistoryRow
      date={item.date}
      orderNumber={item.orderNumber}
      serviceName={item.serviceName}
      items={item.items}
      amount={item.amount}
      status={item.status}
      last={false}
      testID={`earnings-row-${item.id}`}
    />
  );
}

/** Earnings history (E 4.2): one row per assignment-day, approved or waiting for review. */
export default function EarningsHistoryScreen(): JSX.Element {
  const { period } = useLocalSearchParams<{ period?: string }>();
  const viewModel = useEarningsHistoryViewModel(period);
  const { syncPill } = viewModel;

  const header = (
    <Header
      title="Earnings history"
      subtitle={viewModel.periodLabel}
      onBack={viewModel.goBack}
      right={
        <SyncStatusPill
          status={syncPill.status}
          pendingCount={syncPill.pendingCount}
          failedCount={syncPill.failedCount}
          onPress={viewModel.openSyncCenter}
        />
      }
    />
  );

  if (viewModel.state !== 'ready') {
    return (
      <Screen header={header} bottomInset={false}>
        {viewModel.state === 'loading' ? <Loader fullScreen /> : null}
        {viewModel.state === 'waitingForNetwork' ? (
          <EmptyState
            icon="cloud-off"
            title="You're offline"
            body="Your earnings will load when you're back online."
          />
        ) : null}
        {viewModel.state === 'error' ? (
          <ErrorState message={viewModel.loadError?.message} onRetry={viewModel.retry} />
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen header={header} bottomInset={false}>
      <FlashList
        data={viewModel.rows}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {viewModel.filterOptions.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={option.value === viewModel.selectedFilter}
                  onPress={() => {
                    viewModel.selectFilter(option.value);
                  }}
                  testID={`earnings-filter-${option.value}`}
                />
              ))}
            </ScrollView>
            <EarningsTableHeader />
          </View>
        }
        ListFooterComponent={
          viewModel.subtotal ? (
            <EarningsSubtotalRow
              items={viewModel.subtotal.items}
              amount={viewModel.subtotal.amount}
            />
          ) : (
            <TableEmptyRow message={viewModel.emptyMessage} testID="earnings-empty" />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={viewModel.isRefreshing}
            onRefresh={viewModel.refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  chips: { gap: spacing.sm, paddingVertical: spacing.lg },
});
