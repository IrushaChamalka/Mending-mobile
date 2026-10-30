import { makeTask } from '@/features/tasks/__fixtures__/taskFixtures';

import {
  approvedByDay,
  buildHistoryRows,
  formatPeriod,
  matchesHistoryFilter,
  periodFor,
  summarizePeriod,
  totalHistoryRows,
} from '../earningsRules';

import { makeApprovedEarning } from '../../__fixtures__/salaryFixtures';

const today = '2026-10-09';

const submitted = makeTask({
  id: 'pending-1',
  status: 'SUBMITTED',
  dueDate: '2026-10-09',
  latestSubmission: {
    photoUrl: null,
    note: null,
    submittedAt: '2026-10-09T15:00:00.000Z',
    completedQuantity: 184,
    acceptedQuantity: 0,
  },
  payout: { unitRate: 18, estimated: 3420, completed: 3312, accepted: 0 },
});

const approved = [
  makeApprovedEarning({ assignmentId: 'a', date: '2026-10-08', amount: 3420 }),
  makeApprovedEarning({ assignmentId: 'b', date: '2026-10-04', amount: 140, acceptedQuantity: 14 }),
  makeApprovedEarning({ assignmentId: 'c', date: '2026-09-28', amount: 5000 }),
];

describe('periodFor', () => {
  it('runs this month from the 1st to today, as "1–9 Oct 2026" (E 4.1)', () => {
    const period = periodFor('thisMonth', today);
    expect(period).toEqual({ start: '2026-10-01', end: '2026-10-09' });
    expect(formatPeriod(period)).toBe('1–9 Oct 2026');
  });

  it('covers last month in full, and rolling 7 and 30 days', () => {
    expect(periodFor('lastMonth', today)).toEqual({ start: '2026-09-01', end: '2026-09-30' });
    expect(periodFor('last7Days', today)).toEqual({ start: '2026-10-03', end: '2026-10-09' });
    expect(periodFor('last30Days', today)).toEqual({ start: '2026-09-10', end: '2026-10-09' });
    expect(formatPeriod(periodFor('last30Days', today))).toBe('10 Sep – 9 Oct 2026');
  });

  it('handles January', () => {
    expect(periodFor('lastMonth', '2027-01-15')).toEqual({
      start: '2026-12-01',
      end: '2026-12-31',
    });
  });
});

describe('summarizePeriod', () => {
  it('adds pending work to approved earnings for the estimate', () => {
    expect(summarizePeriod(approved, [submitted], periodFor('thisMonth', today))).toEqual({
      estimated: 6872,
      approved: 3560,
      pending: 3312,
      items: 192 + 192 + 184,
      acceptedItems: 190 + 14,
    });
  });

  it('ignores open and reviewed tasks: reviewed work is already in the salary', () => {
    const open = makeTask({ status: 'ACCEPTED', dueDate: today });
    const reviewed = makeTask({ status: 'REVIEWED', dueDate: today });
    const summary = summarizePeriod([], [open, reviewed], periodFor('thisMonth', today));
    expect(summary.estimated).toBe(0);
  });
});

describe('buildHistoryRows', () => {
  it('lists approved and pending rows in the period, newest first', () => {
    const rows = buildHistoryRows(approved, [submitted], periodFor('thisMonth', today));
    expect(rows.map((row) => [row.id, row.status, row.items, row.amount])).toEqual([
      ['pending-1', 'pending', 184, 3312],
      ['a', 'approved', 190, 3420],
      ['b', 'approved', 14, 140],
    ]);
    expect(rows.filter((row) => matchesHistoryFilter(row, 'pending'))).toHaveLength(1);
    expect(totalHistoryRows(rows)).toEqual({ items: 388, amount: 6872 });
  });
});

describe('approvedByDay', () => {
  it('has a value for every day, zero days included', () => {
    const days = approvedByDay(approved, { start: '2026-10-03', end: '2026-10-05' });
    expect(days).toEqual([
      { date: '2026-10-03', amount: 0 },
      { date: '2026-10-04', amount: 140 },
      { date: '2026-10-05', amount: 0 },
    ]);
  });

  it('adds up several assignments on the same day', () => {
    const sameDay = [
      makeApprovedEarning({ assignmentId: 'x', date: today, amount: 100.1 }),
      makeApprovedEarning({ assignmentId: 'y', date: today, amount: 200.2 }),
    ];
    expect(approvedByDay(sameDay, { start: today, end: today })).toEqual([
      { date: today, amount: 300.3 },
    ]);
  });
});
