/** True for plain objects (not null, not arrays). Use before reading properties of unknown JSON. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
