import type { MyTaskDto } from '../data/dto';

/** A my-tasks item exactly as the backend sends it (API_CONTRACT §5.3, backend-local/samples). */
export function makeTaskDto(overrides: Partial<MyTaskDto> = {}): MyTaskDto {
  return {
    assignmentId: '33333333-3333-4333-8333-333333333333',
    orderId: '11111111-1111-4111-8111-111111111111',
    orderNumber: 'ORD-2026-0142',
    customerName: 'Lanka Apparel Ltd',
    location: 'Biyagama factory',
    orderLine: {
      orderLineId: '22222222-2222-4222-8222-222222222222',
      lineNumber: 1,
      garmentDescription: "Men's Formal Shirts",
      serviceName: 'Mending & Stitch Repair',
      serviceCode: 'MEND',
      color: 'Blue / Navy Stripe',
      size: 'M - 15.5',
      styleNumber: 'BS-4902',
      unitRate: 18,
    },
    unitRate: 18,
    estimatedPayout: 2700,
    completedPayout: 0,
    acceptedPayout: 0,
    assignmentDate: '2026-10-20T00:00:00.000Z',
    acceptedAt: null,
    targetQuantity: 150,
    completedQuantity: 0,
    acceptedQuantity: 0,
    customerSignatureUrl: null,
    status: 'ASSIGNED',
    notes: null,
    reviewNotes: null,
    submittedAt: null,
    reviewedAt: null,
    rejectedAt: null,
    rejectionReason: null,
    ...overrides,
  };
}
