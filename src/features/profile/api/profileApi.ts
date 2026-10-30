import { endpoints } from '@/shared/api/endpoints';
import { httpClient } from '@/shared/api/httpClient';

import { changePasswordFieldErrorMap, type ChangePasswordRequestDto } from '../data/dto';

/** Raw profile calls. Each resolves to the response's `data` payload, which the data layer validates. */
export interface ProfileApi {
  /** GET /api/v1/employee/profile (EMPLOYEE only). */
  getEmployeeProfile(): Promise<unknown>;
  /** GET /api/v1/supervisor/profile (SUPERVISOR only). */
  getSupervisorProfile(): Promise<unknown>;
  /** PATCH /api/v1/employee/profile with only `password` (EMPLOYEE only). */
  changePassword(request: ChangePasswordRequestDto): Promise<unknown>;
}

export const httpProfileApi: ProfileApi = {
  getEmployeeProfile: () => httpClient.get(endpoints.profile.employee),
  getSupervisorProfile: () => httpClient.get(endpoints.profile.supervisor),
  changePassword: (request) =>
    httpClient.patch(endpoints.profile.employee, request, {
      fieldErrorMap: changePasswordFieldErrorMap,
    }),
};
