import type { JSX } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { EmptyState } from './EmptyState';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Please check your connection and try again.',
  onRetry,
  style,
  testID,
}: ErrorStateProps): JSX.Element {
  return (
    <EmptyState
      icon="alert-circle"
      tone="danger"
      title={title}
      body={message}
      actionLabel={onRetry ? 'Try again' : undefined}
      onAction={onRetry}
      actionVariant="outline"
      style={style}
      testID={testID}
    />
  );
}
