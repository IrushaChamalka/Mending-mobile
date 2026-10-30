import { salaryResponseSchema } from '../../data/dto';
import { mockEarningsApi } from '../mockEarningsApi';

jest.mock('@/features/auth', () => ({
  getSessionUser: () => ({ id: 'e1', employeeId: 'user00006', role: 'EMPLOYEE', phone: null }),
}));
// The barrel pulls in the session and Sentry; the salary mock only needs the mock tasks.
jest.mock('@/features/tasks', () => ({
  listMockTasks: jest.requireActual<{ listMockTasks: () => unknown[] }>(
    '@/features/tasks/api/mockTasksApi',
  ).listMockTasks,
}));
jest.mock('@/shared/api/mock', () => ({
  ...jest.requireActual<object>('@/shared/api/mock'),
  mockDelay: () => Promise.resolve(),
}));

describe('mockEarningsApi', () => {
  it("sums the mock tasks' reviewed work exactly as the backend does", async () => {
    const payload = salaryResponseSchema.parse(await mockEarningsApi.getSalary());
    const { salarySummary } = payload;
    expect(salarySummary.totalPaid).toBe(10000);
    expect(salarySummary.remainingBalance).toBe(
      Math.max(0, salarySummary.totalEarned - salarySummary.totalPaid),
    );
    expect(salarySummary.totalEarned).toBeGreaterThan(20000);
    expect(payload.acceptedAssignments.length).toBeGreaterThan(0);
  });
});
