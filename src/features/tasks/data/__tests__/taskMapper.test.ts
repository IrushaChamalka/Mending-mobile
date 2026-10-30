import { toTask } from '../taskMapper';

import { makeTaskDto } from '../../__fixtures__/taskDtoFixtures';

describe('toTask', () => {
  it('maps an assigned task, keeping the working day as a calendar date', () => {
    expect(toTask(makeTaskDto({ notes: 'Start with the collars.' }))).toEqual({
      id: '33333333-3333-4333-8333-333333333333',
      title: 'Mending & Stitch Repair · 150 garments',
      garment: {
        description: "Men's Formal Shirts",
        color: 'Blue / Navy Stripe',
        size: 'M - 15.5',
        styleNumber: 'BS-4902',
      },
      status: 'ASSIGNED',
      dueDate: '2026-10-20',
      target: { value: 150, unit: 'garments', achieved: 0 },
      latestSubmission: null,
      review: null,
      instructions: 'Start with the collars.',
      serviceName: 'Mending & Stitch Repair',
      orderNumber: 'ORD-2026-0142',
      customerName: 'Lanka Apparel Ltd',
      location: 'Biyagama factory',
      acceptedAt: null,
      payout: { unitRate: 18, estimated: 2700, completed: 0, accepted: 0 },
      rejectionReason: null,
    });
  });

  it('recomputes payouts the payload leaves out, and keeps the decline reason', () => {
    const task = toTask(
      makeTaskDto({
        status: 'REJECTED',
        unitRate: undefined,
        estimatedPayout: undefined,
        completedPayout: undefined,
        acceptedPayout: undefined,
        rejectedAt: '2026-10-20T06:00:00.000Z',
        rejectionReason: ' On leave. ',
      }),
    );
    expect(task.payout).toEqual({ unitRate: 18, estimated: 2700, completed: 0, accepted: 0 });
    expect(task.rejectionReason).toBe('On leave.');
  });

  it('reads the note as the worker note once the task is submitted', () => {
    const task = toTask(
      makeTaskDto({
        status: 'SUBMITTED',
        completedQuantity: 136,
        notes: 'Two pieces need another dye pass.',
        customerSignatureUrl: 'https://bucket.s3.amazonaws.com/sheet.jpg',
        submittedAt: '2026-10-20T14:30:00.000Z',
      }),
    );
    expect(task.instructions).toBeNull();
    expect(task.latestSubmission).toEqual({
      photoUrl: 'https://bucket.s3.amazonaws.com/sheet.jpg',
      note: 'Two pieces need another dye pass.',
      submittedAt: '2026-10-20T14:30:00.000Z',
      completedQuantity: 136,
      acceptedQuantity: 0,
    });
    expect(task.target.achieved).toBe(136);
  });

  it('counts accepted pieces and exposes the review once reviewed', () => {
    const task = toTask(
      makeTaskDto({
        status: 'REVIEWED',
        completedQuantity: 118,
        acceptedQuantity: 110,
        submittedAt: '2026-10-20T14:30:00.000Z',
        reviewedAt: '2026-10-21T09:30:00.000Z',
        reviewNotes: 'Eight pieces sent back for rework.',
      }),
    );
    expect(task.target.achieved).toBe(110);
    expect(task.review).toEqual({
      reviewedAt: '2026-10-21T09:30:00.000Z',
      notes: 'Eight pieces sent back for rework.',
      acceptedQuantity: 110,
      completedQuantity: 118,
    });
  });

  it('titles the work by service, then garment, then a generic title', () => {
    const line = makeTaskDto().orderLine;
    expect(toTask(makeTaskDto({ orderLine: { ...line, serviceName: '  ' } })).title).toBe(
      "Men's Formal Shirts · 150 garments",
    );
    expect(
      toTask(
        makeTaskDto({
          targetQuantity: 0,
          orderLine: { ...line, garmentDescription: null, serviceName: null },
        }),
      ).title,
    ).toBe('Task');
  });
});
