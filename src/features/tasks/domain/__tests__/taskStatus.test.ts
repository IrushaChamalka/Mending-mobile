import type { TaskStatus } from '../../types';
import {
  countOpenTasks,
  isOnTodaysList,
  matchesTaskFilter,
  sortTasksForList,
  type TaskFilter,
} from '../taskFilters';
import { getDueLabel, getTaskBadge, isReworkTask } from '../taskStatus';

import { makeTask } from '../../__fixtures__/taskFixtures';

const today = '2026-10-09';

describe('getTaskBadge', () => {
  it('flags open work past its day as Overdue (E 3.1)', () => {
    const task = makeTask({ status: 'ACCEPTED', dueDate: '2026-10-03' });
    expect(getTaskBadge(task, today)).toEqual({ label: 'Overdue', tone: 'danger' });
  });

  it('shows open rework-service tasks as Rework', () => {
    const task = makeTask({ status: 'ASSIGNED', serviceName: 'Rework', dueDate: '2026-10-10' });
    expect(getTaskBadge(task, today)).toEqual({ label: 'Rework', tone: 'warning' });
  });

  it.each<[TaskStatus, string]>([
    ['ASSIGNED', 'Assigned'],
    ['ACCEPTED', 'In progress'],
    ['IN_PROGRESS', 'In progress'],
    ['SUBMITTED', 'Submitted'],
    ['REVIEWED', 'Done'],
    ['REJECTED', 'Declined'],
    ['CANCELLED', 'Cancelled'],
  ])('labels %s as %s', (status, label) => {
    expect(getTaskBadge(makeTask({ status, dueDate: today }), today).label).toBe(label);
  });

  it('never calls finished work overdue', () => {
    const task = makeTask({ status: 'REVIEWED', dueDate: '2026-10-01' });
    expect(getTaskBadge(task, today).label).toBe('Done');
  });
});

describe('getDueLabel', () => {
  it('counts overdue days', () => {
    expect(getDueLabel(makeTask({ status: 'ACCEPTED', dueDate: '2026-10-03' }), today)).toEqual({
      label: 'Overdue 6 days',
      isOverdue: true,
    });
    expect(getDueLabel(makeTask({ status: 'ASSIGNED', dueDate: '2026-10-08' }), today).label).toBe(
      'Overdue 1 day',
    );
  });

  it('says "Due today" for open work due today and the day otherwise', () => {
    expect(getDueLabel(makeTask({ dueDate: today }), today).label).toBe('Due today');
    expect(getDueLabel(makeTask({ dueDate: '2026-10-12' }), today).label).toBe('12 Oct');
    expect(getDueLabel(makeTask({ status: 'REVIEWED', dueDate: today }), today).label).toBe(
      '9 Oct',
    );
  });
});

describe('isReworkTask', () => {
  it('matches the service name, whatever its case', () => {
    expect(isReworkTask({ serviceName: 'Rework' })).toBe(true);
    expect(isReworkTask({ serviceName: 'Garment rework' })).toBe(true);
    expect(isReworkTask({ serviceName: 'Mending' })).toBe(false);
    expect(isReworkTask({ serviceName: null })).toBe(false);
  });
});

describe('matchesTaskFilter', () => {
  it.each<[TaskFilter, Partial<Parameters<typeof makeTask>[0]>, boolean]>([
    ['all', { status: 'CANCELLED' }, true],
    ['dueToday', { status: 'ACCEPTED', dueDate: today }, true],
    ['dueToday', { status: 'ACCEPTED', dueDate: '2026-10-08' }, false],
    ['dueToday', { status: 'SUBMITTED', dueDate: today }, false],
    ['rework', { serviceName: 'Rework' }, true],
    ['rework', { serviceName: 'Mending' }, false],
    ['done', { status: 'SUBMITTED' }, true],
    ['done', { status: 'REVIEWED' }, true],
    ['done', { status: 'ACCEPTED' }, false],
  ])('%s with %o: %s', (filter, overrides, expected) => {
    expect(matchesTaskFilter(makeTask(overrides), filter, today)).toBe(expected);
  });
});

describe('sortTasksForList', () => {
  it('puts today first, then overdue, upcoming, submitted and reviewed work', () => {
    const tasks = [
      makeTask({ id: 'reviewed', status: 'REVIEWED', dueDate: '2026-10-05' }),
      makeTask({ id: 'upcoming-late', status: 'ASSIGNED', dueDate: '2026-10-12' }),
      makeTask({ id: 'submitted', status: 'SUBMITTED', dueDate: '2026-10-08' }),
      makeTask({ id: 'overdue', status: 'ACCEPTED', dueDate: '2026-10-03' }),
      makeTask({ id: 'upcoming-soon', status: 'ASSIGNED', dueDate: '2026-10-10' }),
      makeTask({ id: 'today', status: 'ACCEPTED', dueDate: today }),
      makeTask({ id: 'declined', status: 'REJECTED', dueDate: '2026-10-07' }),
    ];
    expect(sortTasksForList(tasks, today).map((task) => task.id)).toEqual([
      'today',
      'overdue',
      'upcoming-soon',
      'upcoming-late',
      'submitted',
      'reviewed',
      'declined',
    ]);
  });
});

describe("Today's tasks and the open count", () => {
  it('lists open work due today or earlier', () => {
    expect(isOnTodaysList(makeTask({ status: 'ACCEPTED', dueDate: today }), today)).toBe(true);
    expect(isOnTodaysList(makeTask({ status: 'ACCEPTED', dueDate: '2026-10-01' }), today)).toBe(
      true,
    );
    expect(isOnTodaysList(makeTask({ status: 'ASSIGNED', dueDate: '2026-10-10' }), today)).toBe(
      false,
    );
    expect(isOnTodaysList(makeTask({ status: 'SUBMITTED', dueDate: today }), today)).toBe(false);
  });

  it('counts open tasks only', () => {
    expect(
      countOpenTasks([
        makeTask({ status: 'ASSIGNED' }),
        makeTask({ status: 'ACCEPTED' }),
        makeTask({ status: 'REVIEWED' }),
        makeTask({ status: 'REJECTED' }),
      ]),
    ).toBe(2);
  });
});
