import type { JSX } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/shared/theme';
import {
  Banner,
  Button,
  EmptyState,
  ErrorState,
  Header,
  Loader,
  Screen,
  SyncStatusPill,
  TextButton,
} from '@/shared/ui';

import { AmountField } from '../components/AmountField';
import { AvailableBalanceCard } from '../components/AvailableBalanceCard';
import { PayoutToCard } from '../components/PayoutToCard';
import { QuickAmountChips } from '../components/QuickAmountChips';
import { useWithdrawRequestViewModel } from '../hooks/useWithdrawRequestViewModel';

/** Request a payout (E 5.1, E 5.2). */
export default function WithdrawRequestScreen(): JSX.Element {
  const viewModel = useWithdrawRequestViewModel();
  const { state, syncPill, account, nothingToWithdraw } = viewModel;

  const header = (
    <Header
      title="Withdraw"
      subtitle="Request a payout"
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

  if (state !== 'ready' || !account) {
    return (
      <Screen bottomInset={false} header={header}>
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
        {state === 'unavailable' ? (
          <EmptyState
            icon="wallet"
            title="Payouts are arranged by your admin"
            body="Requesting a payout from the app is not available yet. Your payouts are listed in your withdrawal history."
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
      keyboardAvoiding
      bottomInset={false}
      header={header}
      contentStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={viewModel.isRefreshing}
          onRefresh={viewModel.refresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      footer={
        <Button
          title="Review request"
          onPress={viewModel.review}
          disabled={!viewModel.canReview}
          testID="withdraw-review"
        />
      }
    >
      <AvailableBalanceCard amount={viewModel.availableLabel} testID="withdraw-available" />
      {nothingToWithdraw ? (
        <Banner
          tone="info"
          icon="wallet"
          title={nothingToWithdraw.title}
          message={nothingToWithdraw.message}
          testID="withdraw-nothing"
        />
      ) : (
        <View style={styles.amount}>
          <AmountField
            label="Amount (LKR)"
            value={viewModel.amountText}
            onChangeText={viewModel.changeAmount}
            error={viewModel.amountError}
            testID="withdraw-amount"
          />
          <QuickAmountChips
            options={viewModel.quickAmounts}
            onSelect={viewModel.selectQuickAmount}
          />
        </View>
      )}
      <PayoutToCard
        title={account.title}
        subtitle={account.subtitle}
        onPress={viewModel.openPayoutAccount}
        testID="withdraw-payout-account"
      />
      <Banner message="Only approved earnings can be withdrawn. Your admin approves requests, usually within 2 working days." />
      <TextButton
        title="View withdrawal history"
        onPress={viewModel.openHistory}
        style={styles.history}
        testID="withdraw-history"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.lg },
  amount: { gap: spacing.lg },
  history: { alignSelf: 'center' },
});
