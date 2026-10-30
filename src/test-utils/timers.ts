/**
 * Runs all fake timers (for example a mock api's simulated delay) and returns the promise's result.
 * Handlers are attached before the timers run, so a rejection is never reported as unhandled.
 * Call jest.useFakeTimers() first.
 */
export async function settleWithTimers<T>(promise: Promise<T>): Promise<T> {
  const outcome = promise.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  );
  await jest.runAllTimersAsync();
  const settled = await outcome;
  if (settled.ok) return settled.value;
  throw settled.error;
}
