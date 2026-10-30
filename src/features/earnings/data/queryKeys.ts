/** Every query key of the earnings feature. */
export const earningsKeys = {
  all: ['earnings'] as const,
  salary: () => [...earningsKeys.all, 'salary'] as const,
};
