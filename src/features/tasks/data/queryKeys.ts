/** Every query and mutation key of the tasks feature. */
export const taskKeys = {
  all: ['tasks'] as const,
  list: () => [...taskKeys.all, 'list'] as const,
};

export const taskMutationKeys = {
  /** Registered with setMutationDefaults, so an accept made offline resumes after a restart. */
  accept: ['tasks', 'accept'] as const,
};
