import { endpoints } from '@/shared/api/endpoints';
import { parseItems, parseResponse } from '@/shared/api/parseResponse';

import { tasksApi } from '../api';
import type { AcceptedTask } from '../types';

import { dailyAssignmentSchema, myTaskSchema, myTasksResponseSchema } from './dto';
import type { TaskPage } from './taskCache';
import { toTask } from './taskMapper';

export const tasksRepository = {
  /**
   * One page of the signed-in user's tasks. The backend returns everything at once (API_CONTRACT
   * Gap 4), so page 1 holds every task and there is no next page. When the backend adds paging,
   * only this method changes.
   */
  async fetchTaskPage(page: number, signal?: AbortSignal): Promise<TaskPage> {
    const url = endpoints.tasks.myTasks;
    if (page > 1) return { tasks: [], nextPage: null };
    const payload = await tasksApi.getMyTasks({ signal });
    const response = parseResponse(myTasksResponseSchema, payload, url);
    return { tasks: parseItems(myTaskSchema, response.tasks, url).map(toTask), nextPage: null };
  },

  /** Accepts a task. Resolves to the status and acceptance time the server recorded. */
  async acceptTask(taskId: string): Promise<AcceptedTask> {
    const url = endpoints.tasks.accept(taskId);
    const dto = parseResponse(dailyAssignmentSchema, await tasksApi.acceptTask(taskId), url);
    return { id: dto.id, status: dto.status, acceptedAt: dto.acceptedAt ?? null };
  },
};
