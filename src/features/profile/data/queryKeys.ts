/** Every query key of the profile feature. */
export const profileKeys = {
  all: ['profile'] as const,
  /** Per user, so a cached profile never shows for the next person who signs in. */
  me: (userId: string) => [...profileKeys.all, 'me', userId] as const,
};
