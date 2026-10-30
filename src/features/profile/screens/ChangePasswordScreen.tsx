import type { JSX } from 'react';
import { StyleSheet } from 'react-native';

import { spacing } from '@/shared/theme';
import { Button, Header, Screen, SyncStatusPill } from '@/shared/ui';

import { ChangePasswordFields } from '../components/ChangePasswordFields';
import { useChangePasswordViewModel } from '../hooks/useChangePasswordViewModel';

/** Change password from the profile: the E 1.6 form on an app page, saved to the real backend. */
export default function ChangePasswordScreen(): JSX.Element {
  const viewModel = useChangePasswordViewModel();
  const { syncPill } = viewModel;

  return (
    <Screen
      scroll
      padded
      keyboardAvoiding
      bottomInset={false}
      contentStyle={styles.content}
      header={
        <Header
          title="Change password"
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
      }
      footer={
        <Button
          title="Save password"
          onPress={viewModel.submit}
          loading={viewModel.isSubmitting}
          testID="change-password-submit"
        />
      }
    >
      <ChangePasswordFields
        control={viewModel.control}
        strength={viewModel.strength}
        onSubmit={viewModel.submit}
        onNewPasswordSubmitEditing={viewModel.focusConfirm}
        errorMessage={viewModel.errorMessage}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xl, paddingBottom: spacing.lg },
});
