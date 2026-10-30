import { tasksApi } from '../../api';
import { tasksRepository } from '../tasksRepository';

import { makeTaskDto } from '../../__fixtures__/taskDtoFixtures';

jest.mock('../../api', () => ({ tasksApi: { getMyTasks: jest.fn(), acceptTask: jest.fn() } }));
jest.mock('@/shared/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    breadcrumb: jest.fn(),
  },
}));

const getMyTasks = jest.mocked(tasksApi.getMyTasks);
const acceptTask = jest.mocked(tasksApi.acceptTask);

describe('tasksRepository', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns every task on page 1, with no next page yet', async () => {
    getMyTasks.mockResolvedValue({ date: '2026-10-20', totalTasks: 1, tasks: [makeTaskDto()] });

    const page = await tasksRepository.fetchTaskPage(1);

    expect(page.nextPage).toBeNull();
    expect(page.tasks.map((task) => task.id)).toEqual(['33333333-3333-4333-8333-333333333333']);
  });

  it('drops a row that breaks the contract instead of failing the whole list', async () => {
    getMyTasks.mockResolvedValue({
      date: '2026-10-20',
      totalTasks: 2,
      tasks: [makeTaskDto(), { ...makeTaskDto({ assignmentId: 'second' }), status: 'ARCHIVED' }],
    });

    const page = await tasksRepository.fetchTaskPage(1);

    expect(page.tasks).toHaveLength(1);
  });

  it('reads the accepted status from the accept response', async () => {
    acceptTask.mockResolvedValue({
      id: '33333333-3333-4333-8333-333333333333',
      status: 'ACCEPTED',
      acceptedAt: '2026-10-20T09:12:00.000Z',
      targetQuantity: 150,
    });

    await expect(
      tasksRepository.acceptTask('33333333-3333-4333-8333-333333333333'),
    ).resolves.toEqual({
      id: '33333333-3333-4333-8333-333333333333',
      status: 'ACCEPTED',
      acceptedAt: '2026-10-20T09:12:00.000Z',
    });
  });
});
