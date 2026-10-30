import { z } from 'zod';

/** App-only limit: the backend stores notes as unlimited text (API_CONTRACT Gap 13). */
export const NOTE_MAX_LENGTH = 500;
/** App-only sanity limit against typos; a day's work never reaches 100,000 pieces. */
export const QUANTITY_MAX_DIGITS = 5;

const WHOLE_NUMBER = new RegExp(`^\\d{1,${QUANTITY_MAX_DIGITS}}$`);
const OPTIONAL_WHOLE_NUMBER = new RegExp(`^\\d{0,${QUANTITY_MAX_DIGITS}}$`);

/**
 * Submit form rules, mirroring the backend's SubmitDailyWorkDto (API_CONTRACT §7): completed pieces
 * required, whole number ≥ 0; accepted pieces optional, whole number ≥ 0. App-only: accepted ≤
 * completed (the server checks this only at review) and a 500-character note.
 */
export const submitFormSchema = z
  .object({
    completedQuantity: z
      .string()
      .trim()
      .min(1, { error: 'Enter how many pieces you completed.' })
      .regex(WHOLE_NUMBER, { error: 'Use whole numbers only.' })
      .transform(Number),
    acceptedQuantity: z
      .string()
      .trim()
      .regex(OPTIONAL_WHOLE_NUMBER, { error: 'Use whole numbers only.' })
      .transform((value) => (value === '' ? null : Number(value))),
    note: z
      .string()
      .trim()
      .max(NOTE_MAX_LENGTH, { error: `Keep the note under ${NOTE_MAX_LENGTH} characters.` })
      .transform((value) => (value === '' ? null : value)),
  })
  .refine(
    (values) =>
      values.acceptedQuantity === null || values.acceptedQuantity <= values.completedQuantity,
    { error: 'Accepted pieces cannot be more than completed pieces.', path: ['acceptedQuantity'] },
  );

export type SubmitFormInput = z.input<typeof submitFormSchema>;
export type SubmitFormValues = z.output<typeof submitFormSchema>;
