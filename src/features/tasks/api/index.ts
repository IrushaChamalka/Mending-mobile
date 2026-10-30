import { env } from '@/shared/config/env';

import { mockTasksApi } from './mockTasksApi';
import { httpTasksApi, type TasksApi } from './tasksApi';

export type { TasksApi } from './tasksApi';

/** The real or the mock implementation, chosen once by EXPO_PUBLIC_USE_MOCK_API. */
export const tasksApi: TasksApi = env.useMockApi ? mockTasksApi : httpTasksApi;
