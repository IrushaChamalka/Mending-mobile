import type { JSX } from 'react';

import { Card, QueueRow } from '@/shared/ui';

import type { SyncQueueRow } from '../hooks/useSyncCenterViewModel';

export interface UploadQueueCardProps {
  rows: SyncQueueRow[];
  onRetry: (id: string) => void;
  onDiscard: (id: string) => void;
}

/** The queue card of M 6.1: one 55 dp row per submission, with Retry or Discard on failed rows. */
export function UploadQueueCard({ rows, onRetry, onDiscard }: UploadQueueCardProps): JSX.Element {
  return (
    <Card padded={false} testID="sync-queue">
      {rows.map((row, index) => (
        <QueueRow
          key={row.id}
          title={row.title}
          subtitle={row.subtitle}
          statusLabel={row.badge.label}
          statusTone={row.badge.tone}
          onRetry={
            row.canRetry
              ? () => {
                  onRetry(row.id);
                }
              : undefined
          }
          onDiscard={
            row.canDiscard
              ? () => {
                  onDiscard(row.id);
                }
              : undefined
          }
          divider={index < rows.length - 1}
        />
      ))}
    </Card>
  );
}
