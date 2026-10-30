/** Every query and mutation key of the withdrawals feature. */
export const withdrawalKeys = {
  all: ['withdrawals'] as const,
  list: () => [...withdrawalKeys.all, 'list'] as const,
  payoutAccount: () => [...withdrawalKeys.all, 'payoutAccount'] as const,
};

export const withdrawalMutationKeys = {
  create: ['withdrawals', 'create'] as const,
};
