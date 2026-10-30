import type { JSX } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { Banner } from '@/shared/ui';

import type { TaskUploadInfo } from '../types';

export interface TaskUploadNoticeProps {
  upload: TaskUploadInfo;
  isOnline: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Where a task's submission is on its way to the server, for the task detail screen. */
export function TaskUploadNotice({ upload, isOnline, style }: TaskUploadNoticeProps): JSX.Element {
  if (upload.status === 'failed') {
    return (
      <Banner
        tone="danger"
        title="Upload failed"
        message={upload.error?.message ?? 'The submission could not be uploaded.'}
        style={style}
        testID="task-upload-failed"
      />
    );
  }
  if (upload.status === 'uploading') {
    return (
      <Banner
        tone="info"
        icon="upload-cloud"
        title={`Submitting… ${Math.round((upload.progress ?? 0) * 100)}%`}
        message="Saved on this device. If you leave the app, the upload continues when you come back."
        style={style}
      />
    );
  }
  if (!isOnline) {
    return (
      <Banner
        tone="warning"
        icon="cloud-off"
        title="Waiting for a connection"
        message="Your submission is saved on this device and uploads automatically when you're back online."
        style={style}
      />
    );
  }
  if (upload.isWaitingToRetry) {
    return (
      <Banner
        tone="warning"
        icon="refresh-cw"
        title="Trying again shortly"
        message="The last attempt didn't go through. The app tries again automatically."
        style={style}
      />
    );
  }
  return (
    <Banner
      tone="info"
      icon="upload-cloud"
      title="Submitting"
      message="Your submission is saved on this device and uploads next."
      style={style}
    />
  );
}
