import { toCalendarDate } from '@/shared/utils/date';
import { formatCount, roundToCents } from '@/shared/utils/number';

import type { Task } from '../types';

import type { MyTaskDto } from './dto';

/** The my-tasks payload has no unit yet (API_CONTRACT Gap 10); the designs count garments. */
const TARGET_UNIT = 'garments';

function textOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** "Mending · 120 garments", or just the service when no target was set. */
function taskTitle(work: string, target: number): string {
  return target > 0 ? `${work} · ${formatCount(target)} ${TARGET_UNIT}` : work;
}

export function toTask(dto: MyTaskDto): Task {
  const line = dto.orderLine;
  const isSubmitted = Boolean(dto.submittedAt);
  const serviceName = textOrNull(line.serviceName);
  const garmentDescription = textOrNull(line.garmentDescription);
  const unitRate = dto.unitRate ?? line.unitRate ?? 0;

  return {
    id: dto.assignmentId,
    title: taskTitle(serviceName ?? garmentDescription ?? 'Task', dto.targetQuantity),
    garment: {
      description: garmentDescription,
      color: textOrNull(line.color),
      size: textOrNull(line.size),
      styleNumber: textOrNull(line.styleNumber),
    },
    status: dto.status,
    dueDate: toCalendarDate(dto.assignmentDate),
    target: {
      value: dto.targetQuantity,
      unit: TARGET_UNIT,
      achieved: dto.status === 'REVIEWED' ? dto.acceptedQuantity : dto.completedQuantity,
    },
    latestSubmission:
      isSubmitted && dto.submittedAt
        ? {
            photoUrl: textOrNull(dto.customerSignatureUrl),
            note: textOrNull(dto.notes),
            submittedAt: dto.submittedAt,
            completedQuantity: dto.completedQuantity,
            acceptedQuantity: dto.acceptedQuantity,
          }
        : null,
    review:
      dto.status === 'REVIEWED' || dto.reviewedAt
        ? {
            reviewedAt: dto.reviewedAt ?? null,
            notes: textOrNull(dto.reviewNotes),
            acceptedQuantity: dto.acceptedQuantity,
            completedQuantity: dto.completedQuantity,
          }
        : null,
    instructions: isSubmitted ? null : textOrNull(dto.notes),
    serviceName,
    orderNumber: textOrNull(dto.orderNumber),
    customerName: textOrNull(dto.customerName),
    location: textOrNull(dto.location),
    acceptedAt: dto.acceptedAt ?? null,
    // The backend sends the products; recomputing them keeps the model right if one is missing.
    payout: {
      unitRate,
      estimated: dto.estimatedPayout ?? roundToCents(dto.targetQuantity * unitRate),
      completed: dto.completedPayout ?? roundToCents(dto.completedQuantity * unitRate),
      accepted: dto.acceptedPayout ?? roundToCents(dto.acceptedQuantity * unitRate),
    },
    rejectionReason: textOrNull(dto.rejectionReason),
  };
}
