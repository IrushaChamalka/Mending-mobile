/**
 * Mock tasks api for EXPO_PUBLIC_USE_MOCK_API=true. The orders, customers and quantities mirror the
 * designs' sample data. Dates are relative to today so the list always looks current.
 * State lives in memory and resets when the app restarts.
 */
import { endpoints } from '@/shared/api/endpoints';
import { mockApiError, mockDelay } from '@/shared/api/mock';
import { shiftCalendarDate, todayCalendarDate } from '@/shared/utils/date';

import type { DailyAssignmentDto, MyTaskDto, MyTasksResponseDto } from '../data/dto';

import type { TasksApi } from './tasksApi';

const HOUR_MS = 60 * 60 * 1000;
const MOCK_EMPLOYEE_ID = 'e0f76534-2109-4d45-a4aa-3456789012de';
const MOCK_SUPERVISOR_ID = 'd9e65423-1098-4c34-b3ff-2345678901cd';

/** A signed tally sheet, like the data: URIs the backend seed stores as submitted photos. */
const MOCK_SHEET_PHOTO =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f8fafc"/><path d="M30 40h240M30 80h240M30 120h240M30 160h240" stroke="%23cbd5e1" stroke-width="2"/><path d="M40 185q40-30 80-5t90-10" fill="none" stroke="%230f172a" stroke-width="3"/></svg>';

function calendarIso(daysFromToday: number): string {
  return `${shiftCalendarDate(todayCalendarDate(), daysFromToday)}T00:00:00.000Z`;
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * HOUR_MS).toISOString();
}

interface MockTaskSpec {
  key: string;
  orderNumber: string;
  customer: 'lanka' | 'island';
  service: 'mending' | 'coloring' | 'rework';
  garment: { description: string; color: string | null; size: string | null };
  daysFromToday: number;
  status: MyTaskDto['status'];
  target: number;
  completed?: number;
  accepted?: number;
  notes?: string | null;
  reviewNotes?: string | null;
  rejectionReason?: string | null;
}

const CUSTOMERS = {
  lanka: {
    orderPrefix: '11111111-1111-4111-8111-',
    customerName: 'Lanka Apparel Ltd',
    location: 'Biyagama',
  },
  island: {
    orderPrefix: '33333333-3333-4333-8333-',
    customerName: 'Island Denim Co.',
    location: 'Internal workshop',
  },
} as const;

/** LKR per piece, as the seeded rate cards set them. */
const SERVICES = {
  mending: { serviceName: 'Mending', serviceCode: 'MEND', unitRate: 18 },
  coloring: { serviceName: 'Coloring', serviceCode: 'COLOR', unitRate: 32 },
  rework: { serviceName: 'Rework', serviceCode: 'REWORK', unitRate: 10 },
} as const;

const denimJacket = { description: 'Denim jacket', color: 'Indigo', size: 'M, L, XL' };
const poloShirt = { description: 'Polo shirt', color: 'Navy', size: 'S, M, L' };

/** The designs' sample data (E 2.1, E 3.1, E 4.2), with dates relative to today. */
const MOCK_TASK_SPECS: readonly MockTaskSpec[] = [
  {
    key: '0142a',
    orderNumber: 'ORD-2026-0142',
    customer: 'lanka',
    service: 'mending',
    garment: denimJacket,
    daysFromToday: 0,
    status: 'ACCEPTED',
    target: 120,
    notes: 'Use matching indigo thread. Re-check button tension before packing.',
  },
  {
    key: '0138a',
    orderNumber: 'ORD-2026-0138',
    customer: 'island',
    service: 'coloring',
    garment: poloShirt,
    daysFromToday: -6,
    status: 'ACCEPTED',
    target: 80,
  },
  {
    key: '0143a',
    orderNumber: 'ORD-2026-0143',
    customer: 'island',
    service: 'mending',
    garment: poloShirt,
    daysFromToday: 3,
    status: 'ASSIGNED',
    target: 60,
  },
  {
    key: '0131a',
    orderNumber: 'ORD-2026-0131',
    customer: 'lanka',
    service: 'rework',
    garment: denimJacket,
    daysFromToday: 0,
    status: 'ASSIGNED',
    target: 14,
    notes: 'Re-stitch the seams your supervisor marked.',
  },
  {
    key: '0142b',
    orderNumber: 'ORD-2026-0142',
    customer: 'lanka',
    service: 'mending',
    garment: denimJacket,
    daysFromToday: -1,
    status: 'SUBMITTED',
    target: 190,
    completed: 184,
    notes: 'Six jackets need new buttons.',
  },
  {
    key: '0142c',
    orderNumber: 'ORD-2026-0142',
    customer: 'lanka',
    service: 'mending',
    garment: denimJacket,
    daysFromToday: -2,
    status: 'REVIEWED',
    target: 190,
    completed: 192,
    accepted: 190,
    reviewNotes: 'Two pieces sent back for rework.',
  },
  {
    key: '0138b',
    orderNumber: 'ORD-2026-0138',
    customer: 'island',
    service: 'coloring',
    garment: poloShirt,
    daysFromToday: -3,
    status: 'REVIEWED',
    target: 160,
    completed: 165,
    accepted: 160,
  },
  {
    key: '0138c',
    orderNumber: 'ORD-2026-0138',
    customer: 'island',
    service: 'coloring',
    garment: poloShirt,
    daysFromToday: -4,
    status: 'REVIEWED',
    target: 170,
    completed: 172,
    accepted: 170,
  },
  {
    key: '0131b',
    orderNumber: 'ORD-2026-0131',
    customer: 'lanka',
    service: 'mending',
    garment: denimJacket,
    daysFromToday: -5,
    status: 'REVIEWED',
    target: 180,
    completed: 180,
    accepted: 176,
  },
  {
    key: '0131c',
    orderNumber: 'ORD-2026-0131',
    customer: 'lanka',
    service: 'rework',
    garment: denimJacket,
    daysFromToday: -6,
    status: 'REVIEWED',
    target: 14,
    completed: 14,
    accepted: 14,
  },
  {
    key: '0129a',
    orderNumber: 'ORD-2026-0129',
    customer: 'island',
    service: 'mending',
    garment: poloShirt,
    daysFromToday: -7,
    status: 'REJECTED',
    target: 40,
    rejectionReason: 'On leave that day.',
  },
  {
    key: '0127a',
    orderNumber: 'ORD-2026-0127',
    customer: 'lanka',
    service: 'mending',
    garment: denimJacket,
    daysFromToday: -8,
    status: 'REVIEWED',
    target: 200,
    completed: 200,
    accepted: 196,
  },
  {
    key: '0127b',
    orderNumber: 'ORD-2026-0127',
    customer: 'lanka',
    service: 'coloring',
    garment: poloShirt,
    daysFromToday: -9,
    status: 'REVIEWED',
    target: 150,
    completed: 150,
    accepted: 148,
  },
];

/** Stable uuid-shaped ids from a short key, so ids survive app restarts. */
function mockUuid(prefix: string, key: string): string {
  const hex = Array.from(key, (character) => character.charCodeAt(0).toString(16))
    .join('')
    .padEnd(12, '0')
    .slice(0, 12);
  return `${prefix}${hex}`;
}

function buildTask(spec: MockTaskSpec): MyTaskDto {
  const customer = CUSTOMERS[spec.customer];
  const service = SERVICES[spec.service];
  const completed = spec.completed ?? 0;
  const accepted = spec.accepted ?? 0;
  const isAccepted = spec.status !== 'ASSIGNED' && spec.status !== 'REJECTED';
  const isSubmitted = spec.status === 'SUBMITTED' || spec.status === 'REVIEWED';
  const hoursAfterDayStart = -spec.daysFromToday * 24;
  return {
    assignmentId: mockUuid('4f6a1c2e-8b3d-4e5f-9a1b-', spec.key),
    orderId: mockUuid(customer.orderPrefix, spec.orderNumber.slice(-4)),
    orderNumber: spec.orderNumber,
    customerName: customer.customerName,
    location: customer.location,
    orderLine: {
      orderLineId: mockUuid(
        '22222222-2222-4222-8222-',
        `${spec.orderNumber.slice(-4)}${spec.service}`,
      ),
      lineNumber: 1,
      garmentDescription: spec.garment.description,
      serviceName: service.serviceName,
      serviceCode: service.serviceCode,
      color: spec.garment.color,
      size: spec.garment.size,
      styleNumber: null,
      unitRate: service.unitRate,
    },
    unitRate: service.unitRate,
    estimatedPayout: spec.target * service.unitRate,
    completedPayout: completed * service.unitRate,
    acceptedPayout: accepted * service.unitRate,
    assignmentDate: calendarIso(spec.daysFromToday),
    acceptedAt: isAccepted ? hoursAgo(hoursAfterDayStart + 2) : null,
    targetQuantity: spec.target,
    completedQuantity: completed,
    acceptedQuantity: accepted,
    customerSignatureUrl: isSubmitted ? MOCK_SHEET_PHOTO : null,
    status: spec.status,
    notes: spec.notes ?? null,
    reviewNotes: spec.reviewNotes ?? null,
    submittedAt: isSubmitted ? hoursAgo(hoursAfterDayStart - 8) : null,
    reviewedAt: spec.status === 'REVIEWED' ? hoursAgo(hoursAfterDayStart - 20) : null,
    rejectedAt: spec.status === 'REJECTED' ? hoursAgo(hoursAfterDayStart + 1) : null,
    rejectionReason: spec.rejectionReason ?? null,
  };
}

function createMockTasks(): MyTaskDto[] {
  return MOCK_TASK_SPECS.map(buildTask);
}

let mockTasks: MyTaskDto[] | null = null;

function tasks(): MyTaskDto[] {
  mockTasks ??= createMockTasks();
  return mockTasks;
}

function copyTask(task: MyTaskDto): MyTaskDto {
  return { ...task, orderLine: { ...task.orderLine } };
}

/** Mock mode only: the mock tasks as the server holds them, for mocks that derive from them (salary). */
export function listMockTasks(): MyTaskDto[] {
  return tasks().map(copyTask);
}

function toDailyAssignment(task: MyTaskDto): DailyAssignmentDto {
  return {
    id: task.assignmentId,
    status: task.status,
    acceptedAt: task.acceptedAt,
    orderId: task.orderId,
    orderLineId: task.orderLine.orderLineId,
    employeeId: MOCK_EMPLOYEE_ID,
    assignmentDate: task.assignmentDate,
    targetQuantity: task.targetQuantity,
    completedQuantity: task.completedQuantity,
    acceptedQuantity: task.acceptedQuantity,
    customerSignatureUrl: task.customerSignatureUrl,
    workerNotes: task.notes,
    submittedAt: task.submittedAt,
    reviewNotes: task.reviewNotes,
    reviewedById: task.reviewedAt ? MOCK_SUPERVISOR_ID : null,
    reviewedAt: task.reviewedAt,
    assignedById: MOCK_SUPERVISOR_ID,
    createdAt: task.assignmentDate,
    updatedAt: new Date().toISOString(),
  };
}

export const mockTasksApi: TasksApi = {
  async getMyTasks(): Promise<MyTasksResponseDto> {
    await mockDelay();
    const all = tasks();
    return { date: todayCalendarDate(), totalTasks: all.length, tasks: all.map(copyTask) };
  },

  async acceptTask(taskId: string): Promise<DailyAssignmentDto> {
    await mockDelay();
    const request = { method: 'PATCH', url: endpoints.tasks.accept(taskId) };
    const task = tasks().find((candidate) => candidate.assignmentId === taskId);
    if (!task) throw mockApiError(404, `Daily assignment "${taskId}" not found`, request);
    if (task.status === 'ASSIGNED') {
      task.status = 'ACCEPTED';
      task.acceptedAt = new Date().toISOString();
    } else if (task.status !== 'ACCEPTED' && task.status !== 'IN_PROGRESS') {
      throw mockApiError(400, `Cannot accept task with status ${task.status}`, request);
    }
    return toDailyAssignment(task);
  },
};

export interface MockSubmission {
  completedQuantity: number;
  acceptedQuantity: number | null;
  note: string | null;
}

/**
 * Mock mode only: records a submission on the mock tasks, as submit-work does on the backend, and
 * returns the DailyAssignment DTO the backend would send.
 */
export function recordMockSubmission(
  taskId: string,
  submission: MockSubmission,
): DailyAssignmentDto {
  const task = tasks().find((candidate) => candidate.assignmentId === taskId);
  if (!task) {
    throw mockApiError(404, `Daily assignment "${taskId}" not found`, {
      method: 'POST',
      url: endpoints.submission.submitWork(taskId),
    });
  }
  task.status = 'SUBMITTED';
  task.completedQuantity = submission.completedQuantity;
  task.completedPayout = submission.completedQuantity * (task.unitRate ?? 0);
  task.acceptedQuantity = submission.acceptedQuantity ?? task.acceptedQuantity;
  task.notes = submission.note ?? task.notes;
  task.customerSignatureUrl = MOCK_SHEET_PHOTO;
  task.submittedAt = new Date().toISOString();
  return toDailyAssignment(task);
}
