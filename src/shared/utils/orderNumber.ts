const YEARLY_NUMBER = /^([A-Z]+)-\d{4}-(\d+)$/;

/** "ORD-2026-0142" → "ORD-0142", as the history tables print it (E 4.2). Other formats are kept. */
export function shortOrderNumber(orderNumber: string): string {
  const match = YEARLY_NUMBER.exec(orderNumber);
  return match ? `${match[1]}-${match[2]}` : orderNumber;
}
