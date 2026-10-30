import type { JSX } from 'react';
import { StyleSheet } from 'react-native';

import { spacing } from '@/shared/theme';
import {
  AppText,
  Button,
  ConfirmDialog,
  Header,
  InfoRows,
  Screen,
  SettingsRow,
  SyncStatusPill,
} from '@/shared/ui';

import { ProfileSummary } from '../components/ProfileSummary';
import { useProfileViewModel } from '../hooks/useProfileViewModel';

/** Profile (E 6.1): details, payout account, change password and sign-out. */
export default function ProfileScreen(): JSX.Element {
  const viewModel = useProfileViewModel();
  const { syncPill } = viewModel;

  return (
    <Screen
      scroll
      padded
      bottomInset={false}
      contentStyle={styles.content}
      header={
        <Header
          title="Profile"
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
    >
      <ProfileSummary
        name={viewModel.name}
        roleLabel={viewModel.roleLabel}
        imageUrl={viewModel.imageUrl}
      />
      <InfoRows
        rows={[
          { label: 'Employee ID', value: viewModel.employeeId },
          { label: 'Phone', value: viewModel.phone },
          { label: 'Age', value: viewModel.age },
          { label: 'Gender', value: viewModel.gender },
        ]}
        style={styles.details}
        testID="profile-details"
      />
      {viewModel.showPayoutAccount ? (
        <SettingsRow
          icon="bank"
          label="Payout account"
          onPress={viewModel.openPayoutAccount}
          style={styles.row}
          testID="profile-payout-account"
        />
      ) : null}
      <SettingsRow
        icon="lock"
        label="Change password"
        onPress={viewModel.openChangePassword}
        style={styles.row}
        testID="profile-change-password"
      />
      <Button
        title="Sign out"
        variant="danger"
        leftIcon="log-out"
        onPress={viewModel.signOut}
        loading={viewModel.isSigningOut}
        style={styles.signOut}
        testID="profile-sign-out"
      />
      <AppText variant="caption" color="textPlaceholder" align="center" style={styles.version}>
        {viewModel.appVersion}
      </AppText>
      <ConfirmDialog
        visible={viewModel.isConfirmingSignOut}
        title="Sign out with unsent work?"
        message={viewModel.signOutMessage}
        confirmLabel="Sign out anyway"
        cancelLabel="Stay signed in"
        destructive
        loading={viewModel.isSigningOut}
        onConfirm={viewModel.confirmSignOut}
        onCancel={viewModel.cancelSignOut}
        testID="profile-sign-out-dialog"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  details: { marginTop: spacing.xl },
  row: { marginTop: spacing.md + spacing.xxs },
  signOut: { marginTop: spacing.xxl },
  version: { marginTop: spacing.md },
});
