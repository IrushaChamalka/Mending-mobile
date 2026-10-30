import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { useSessionUser } from '@/features/auth';

import { profileKeys } from '../data/queryKeys';
import { profileRepository } from '../data/profileRepository';
import type { Profile } from '../types';

/** A name rarely changes; the cached profile also covers offline starts. */
const PROFILE_STALE_TIME_MS = 30 * 60 * 1000;

/** The signed-in user's profile. Disabled while nobody is signed in. */
export function useProfileQuery(): UseQueryResult<Profile | null> {
  const user = useSessionUser();
  return useQuery({
    queryKey: profileKeys.me(user?.id ?? 'signed-out'),
    queryFn: () => (user ? profileRepository.fetchProfile(user.role) : Promise.resolve(null)),
    enabled: user !== null,
    staleTime: PROFILE_STALE_TIME_MS,
  });
}
