import { Stack, useLocalSearchParams } from 'expo-router';
import type { JSX } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import { Button, EmptyState, Header, Screen, SuccessState, SyncStatusPill } from '@/shared/ui';

import { SubmitForm } from '../components/SubmitForm';
import { useSubmitViewModel } from '../hooks/useSubmitViewModel';

/** Quantities, note and photo, then the "Work submitted" screen (M 4.3 adapted, M 4.4). */
export default function SubmitScreen(): JSX.Element {
  const { id, photoUri } = useLocalSearchParams<{ id: string; photoUri?: string }>();
  const viewModel = useSubmitViewModel(id, photoUri);
  const { state, task, syncPill } = viewModel;

  const pill = (
    <SyncStatusPill
      status={syncPill.status}
      pendingCount={syncPill.pendingCount}
      failedCount={syncPill.failedCount}
      onPress={viewModel.openSyncCenter}
    />
  );
  // No swipe back while saving or after submitting: the form has been sent.
  const options = <Stack.Screen options={{ gestureEnabled: viewModel.canLeave }} />;

  if (state === 'submitted' && viewModel.result) {
    return (
      <Screen
        header={<Header title="Submit work" subtitle={task?.title} right={pill} />}
        footer={
          <View style={styles.buttons}>
            <Button title="View task" onPress={viewModel.viewTask} testID="submitted-view-task" />
            <Button
              title="Back to tasks"
              variant="outline"
              onPress={viewModel.backToTasks}
              testID="submitted-back"
            />
          </View>
        }
        padded
      >
        {options}
        <SuccessState
          title={viewModel.result.title}
          lines={viewModel.result.lines}
          badge={viewModel.result.badge}
          style={styles.success}
          testID="submitted"
        />
      </Screen>
    );
  }

  const header = (
    <Header title="Submit work" subtitle={task?.title} onBack={viewModel.goBack} right={pill} />
  );

  if (state === 'form' && viewModel.photoUri) {
    return (
      <Screen
        scroll
        padded
        keyboardAvoiding
        header={header}
        footer={
          <Button
            title="Submit work"
            leftIcon="send"
            onPress={viewModel.submit}
            loading={viewModel.isSubmitting}
            testID="submit-work"
          />
        }
      >
        {options}
        <SubmitForm
          control={viewModel.control}
          photoUri={viewModel.photoUri}
          photoSubtitle={viewModel.photoSubtitle}
          targetLabel={viewModel.targetLabel}
          dueLabel={viewModel.dueLabel}
          noteMaxLength={viewModel.noteMaxLength}
          submitError={viewModel.submitError}
          isOnline={viewModel.isOnline}
          onChangePhoto={viewModel.changePhoto}
          onCompletedSubmitEditing={viewModel.focusAccepted}
          onAcceptedSubmitEditing={viewModel.focusNote}
        />
      </Screen>
    );
  }

  return (
    <Screen header={header}>
      {state === 'missingPhoto' ? (
        <EmptyState
          icon="camera"
          title="Take the photo first"
          body="A submission needs a photo of the tally sheet."
          actionLabel="Open camera"
          onAction={viewModel.takePhoto}
        />
      ) : (
        <EmptyState
          icon="slash"
          title="This task can't take a submission"
          body="It may already be submitted, reviewed or no longer assigned to you."
          actionLabel="Back"
          actionVariant="outline"
          onAction={viewModel.goBack}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  success: { flex: 1, justifyContent: 'center' },
  buttons: { gap: spacing.md + spacing.xxs },
});
