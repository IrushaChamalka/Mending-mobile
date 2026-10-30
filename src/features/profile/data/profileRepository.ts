import type { UserRole } from '@/features/auth';
import { endpoints } from '@/shared/api/endpoints';
import { parseResponse } from '@/shared/api/parseResponse';

import { profileApi } from '../api';
import type { Profile } from '../types';

import { profileDtoSchema, updateProfileResponseSchema } from './dto';
import { toProfile } from './profileMapper';

export const profileRepository = {
  /**
   * The signed-in user's profile from the endpoint for their role. There is no role-agnostic
   * "me" endpoint (API_CONTRACT Gap 3); admin accounts resolve to null and the app shows the
   * details from their session instead.
   */
  async fetchProfile(role: UserRole): Promise<Profile | null> {
    if (role === 'EMPLOYEE') {
      const payload = await profileApi.getEmployeeProfile();
      return toProfile(parseResponse(profileDtoSchema, payload, endpoints.profile.employee));
    }
    if (role === 'SUPERVISOR') {
      const payload = await profileApi.getSupervisorProfile();
      return toProfile(parseResponse(profileDtoSchema, payload, endpoints.profile.supervisor));
    }
    return null;
  },

  /**
   * Sets a new password. The backend does not ask for the current one (API_CONTRACT §4.2), so the
   * signed-in session is the only proof. Rejects with ApiError; field errors land on `newPassword`.
   */
  async changePassword(password: string): Promise<void> {
    const payload = await profileApi.changePassword({ password });
    parseResponse(updateProfileResponseSchema, payload, endpoints.profile.employee);
  },
};
