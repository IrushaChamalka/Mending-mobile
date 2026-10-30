import { zodResolver } from '@hookform/resolvers/zod';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useForm, type Control } from 'react-hook-form';
import { BackHandler } from 'react-native';

import { canSubmitTask, useTask, type Task } from '@/features/tasks';
import { useIsOnline } from '@/shared/hooks/useIsOnline';
import { useToday } from '@/shared/hooks/useToday';
import { logger } from '@/shared/lib/logger';
import type { StatusTone } from '@/shared/theme';
import { formatCalendarDate } from '@/shared/utils/date';
import { formatCount } from '@/shared/utils/number';

import {
  NOTE_MAX_LENGTH,
  submitFormSchema,
  type SubmitFormInput,
  type SubmitFormValues,
} from '../data/submitForm';
import type { SyncPillState } from '../domain/uploadRules';
import { isCapturedPhotoUri } from '../services/photoFiles';
import { enqueueSubmission } from '../services/uploadQueue';
import type { TaskUploadInfo } from '../types';

import { useSyncPill, useUploadInfo } from './useUploads';

const SAVE_FAILED =
  "Couldn't save your submission on this device. Check that the phone has free storage, then try again.";

/**
 * unavailable: the task is gone or cannot take a submission · missingPhoto: opened without a photo
 * from the camera · form · submitted: the success screen (M 4.4).
 */
export type SubmitState = 'unavailable' | 'missingPhoto' | 'form' | 'submitted';

export interface SubmissionResult {
  title: string;
  lines: string[];
  badge: { label: string; tone: StatusTone };
}

export interface SubmitViewModel {
  state: SubmitState;
  task: Task | null;
  photoUri: string | null;
  photoSubtitle: string;
  targetLabel: string;
  dueLabel: string;
  control: Control<SubmitFormInput, unknown, SubmitFormValues>;
  noteMaxLength: number;
  isSubmitting: boolean;
  /** False while saving and on the success screen: back must not return to a sent form. */
  canLeave: boolean;
  submitError: string | null;
  isOnline: boolean;
  syncPill: SyncPillState;
  result: SubmissionResult | null;
  submit: () => void;
  focusAccepted: () => void;
  focusNote: () => void;
  changePhoto: () => void;
  takePhoto: () => void;
  goBack: () => void;
  openSyncCenter: () => void;
  viewTask: () => void;
  backToTasks: () => void;
}

/** What was sent, kept so the success screen never depends on the task staying in the list. */
interface SubmittedWork {
  submissionId: string;
  completedQuantity: number;
  taskTitle: string;
  unit: string;
}

/** The pill under the success mark follows the upload live, until the server confirms it. */
function resultBadge(upload: TaskUploadInfo | null, isOnline: boolean): SubmissionResult['badge'] {
  if (upload === null) return { label: 'Synced', tone: 'success' };
  if (upload.status === 'failed') return { label: 'Upload failed', tone: 'danger' };
  if (upload.status === 'uploading') {
    return { label: `Uploading ${Math.round((upload.progress ?? 0) * 100)}%`, tone: 'warning' };
  }
  return isOnline
    ? { label: 'Waiting to upload', tone: 'warning' }
    : { label: 'Queued · uploads when online', tone: 'warning' };
}

/**
 * The submit screen (brief §13): photo, quantities and note, then the success screen. Submitting
 * saves the work on the device and starts the upload; it never waits for the network.
 */
export function useSubmitViewModel(
  taskId: string,
  photoParam: string | undefined,
): SubmitViewModel {
  const task = useTask(taskId);
  const today = useToday();
  const isOnline = useIsOnline();
  const syncPill = useSyncPill();
  const isSaving = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SubmittedWork | null>(null);
  const upload = useUploadInfo(submitted?.submissionId ?? null);
  const { control, handleSubmit, setFocus } = useForm<SubmitFormInput, unknown, SubmitFormValues>({
    resolver: zodResolver(submitFormSchema),
    defaultValues: { completedQuantity: '', acceptedQuantity: '', note: '' },
  });

  const photoUri = photoParam && isCapturedPhotoUri(photoParam) ? photoParam : null;
  const isDone = submitted !== null;
  const canLeave = !isDone && !isSubmitting;

  // Android back: ignored while saving; on the success screen it opens the task, like "View task".
  useFocusEffect(
    useCallback(() => {
      if (canLeave) return undefined;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (isDone) router.dismissAll();
        return true;
      });
      return () => {
        subscription.remove();
      };
    }, [canLeave, isDone]),
  );

  let state: SubmitState;
  if (isDone) state = 'submitted';
  else if (!task || !canSubmitTask(task)) state = 'unavailable';
  else if (!photoUri) state = 'missingPhoto';
  else state = 'form';

  const save = async (values: SubmitFormValues): Promise<void> => {
    if (!task || !photoUri || isSaving.current) return;
    isSaving.current = true;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const submissionId = await enqueueSubmission({
        taskId,
        taskTitle: task.title,
        taskDueDate: task.dueDate,
        photoUri,
        completedQuantity: values.completedQuantity,
        acceptedQuantity: values.acceptedQuantity,
        note: values.note,
      });
      setSubmitted({
        submissionId,
        completedQuantity: values.completedQuantity,
        taskTitle: task.title,
        unit: task.target.unit,
      });
    } catch (error) {
      logger.error('A submission could not be saved on the device', error, { taskId });
      setSubmitError(SAVE_FAILED);
    } finally {
      isSaving.current = false;
      setIsSubmitting(false);
    }
  };

  const dueLabel = task ? formatCalendarDate(task.dueDate, today) : '';
  const target = task?.target;
  const result: SubmissionResult | null = submitted
    ? {
        title: 'Work submitted',
        lines: [
          `${submitted.taskTitle} · ${formatCount(submitted.completedQuantity)} ${submitted.unit}`,
          'The tally sheet photo is attached.',
        ],
        badge: resultBadge(upload, isOnline),
      }
    : null;

  return {
    state,
    task,
    photoUri,
    photoSubtitle: `Tally sheet · ${dueLabel}`,
    targetLabel:
      target && target.value > 0 ? `${formatCount(target.value)} ${target.unit}` : 'None',
    dueLabel,
    control,
    noteMaxLength: NOTE_MAX_LENGTH,
    isSubmitting,
    canLeave,
    submitError,
    isOnline,
    syncPill,
    result,
    submit: () => {
      // Built at press time: `save` reads a ref, which must not happen during render.
      void handleSubmit(save)();
    },
    focusAccepted: () => {
      setFocus('acceptedQuantity');
    },
    focusNote: () => {
      setFocus('note');
    },
    changePhoto: () => {
      // Back to the photo preview, where it can be retaken.
      if (router.canGoBack()) router.back();
    },
    takePhoto: () => {
      router.replace({ pathname: '/capture/[id]', params: { id: taskId } });
    },
    goBack: () => {
      if (router.canGoBack()) router.back();
      else router.replace({ pathname: '/tasks/[id]', params: { id: taskId } });
    },
    openSyncCenter: () => {
      router.push('/sync');
    },
    viewTask: () => {
      // Camera and submit sit above the tabs, and the task detail is still open in the Tasks tab.
      router.dismissAll();
    },
    backToTasks: () => {
      router.dismissAll();
      router.navigate('/tasks');
    },
  };
}
