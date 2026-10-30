import { endpoints } from '@/shared/api/endpoints';
import { httpClient } from '@/shared/api/httpClient';

/** Raw task calls. Each resolves to the response's `data` payload, which the data layer validates. */
export interface TasksApi {
  /** GET /api/v1/orders/my-tasks: every assignment of the signed-in user (no paging yet, Gap 4). */
  getMyTasks(options?: { signal?: AbortSignal }): Promise<unknown>;
  /** PATCH /api/v1/orders/daily-assignments/:id/accept */
  acceptTask(taskId: string): Promise<unknown>;
}

export const httpTasksApi: TasksApi = {
  getMyTasks: (options = {}) => httpClient.get(endpoints.tasks.myTasks, { signal: options.signal }),
  acceptTask: (taskId) => httpClient.patch(endpoints.tasks.accept(taskId)),
};
