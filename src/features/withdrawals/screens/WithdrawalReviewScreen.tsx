import { Stack, useLocalSearchParams } from 'expo-router';
import type { JSX } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import {
  Banner,
  Button,
  EmptyState,
  ErrorState,
  Header,
  Loader,
  Screen,
  SyncStatusPill,
} from '@/shared/ui';

import { WithdrawalReviewCard } from '../components/WithdrawalReviewCard';
import { useWithdrawalReviewViewModel } from '../hooks/useWithdrawalReviewViewModel';

/** Check the request, then send it (E 5.3). */
export default function WithdrawalReviewScreen(): JSX.Element {
  const { amount } = useLocalSearchParams<{ amount?: string }>();
  const viewModel = useWithdrawalReviewViewModel(amount);
  const { state, syncPill } = viewModel;

  const header = (
    <Header
      title="Review request"
      subtitle="Check the details"
      onBack={viewModel.editAmount}
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
  // No swipe back while the request is on its way.
  const options = <Stack.Screen options={{ gestureEnabled: viewModel.canLeave }} />;

  if (state !== 'ready') {
    return (
      <Screen bottomInset={false} header={header}>
        {options}
        {state === 'loading' ? <Loader fullScreen label="Loading your balance" /> : null}
        {state === 'waitingForNetwork' ? (
          <EmptyState
            icon="cloud-off"
            title="You're offline"
            body="Your balance will load when you're back online."
          />
        ) : null}
        {state === 'error' ? (
          <ErrorState message={viewModel.loadError?.message} onRetry={viewModel.retry} />
        ) : null}
        {state === 'invalid' ? (
          <EmptyState
            icon="alert-circle"
            tone="danger"
            title="This amount can't be requested"
            body={viewModel.invalidReason ?? undefined}
            actionLabel="Edit amount"
            onAction={viewModel.editAmount}
            testID="review-invalid"
          />
        ) : null}
        {state === 'unavailable' ? (
          <EmptyState
            icon="wallet"
            title="Payouts are arranged by your admin"
            body="Requesting a payout from the app is not available yet."
            actionLabel="View withdrawal history"
            onAction={viewModel.openHistory}
          />
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      padded
      bottomInset={false}
      header={header}
      contentStyle={styles.content}
      footer={
        <View style={styles.buttons}>
          <Button
            title="Submit request"
            leftIcon="send"
            onPress={viewModel.submit}
            loading={viewModel.isSubmitting}
            disabled={!viewModel.canSubmit && !viewModel.isSubmitting}
            testID="review-submit"
          />
          <Button
            title="Edit amount"
            variant="outline"
            onPress={viewModel.editAmount}
            disabled={!viewModel.canLeave}
            testID="review-edit"
          />
        </View>
      }
    >
      {options}
      <WithdrawalReviewCard amount={viewModel.amountLabel} rows={viewModel.rows} />
      <Banner
        tone="warning"
        icon="alert-circle"
        message="This amount is held until your admin approves or rejects the request."
      />
      {viewModel.isOnline ? null : (
        <Banner
          tone="warning"
          icon="cloud-off"
          title="You are offline"
          message="Payout requests are sent only while you're online. Connect to the internet to submit."
          testID="review-offline"
        />
      )}
      {viewModel.submitError ? (
        <Banner
          tone="danger"
          variant="alert"
          message={viewModel.submitError}
          testID="review-error"
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.lg },
  buttons: { gap: spacing.md + spacing.xxs },
});
