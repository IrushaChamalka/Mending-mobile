import { NOTE_MAX_LENGTH, submitFormSchema, type SubmitFormInput } from '../submitForm';

function parse(overrides: Partial<SubmitFormInput>): ReturnType<typeof submitFormSchema.safeParse> {
  return submitFormSchema.safeParse({
    completedQuantity: '120',
    acceptedQuantity: '',
    note: '',
    ...overrides,
  });
}

function firstError(overrides: Partial<SubmitFormInput>, field: keyof SubmitFormInput): string {
  const result = parse(overrides);
  if (result.success) throw new Error('Expected the form to be invalid');
  return result.error.issues.find((issue) => issue.path[0] === field)?.message ?? '';
}

describe('submitFormSchema', () => {
  it('turns the fields into the backend values, leaving empty optional fields out', () => {
    const result = parse({ completedQuantity: ' 120 ', note: '  ' });
    expect(result.success && result.data).toEqual({
      completedQuantity: 120,
      acceptedQuantity: null,
      note: null,
    });
  });

  it('keeps the accepted quantity and a trimmed note', () => {
    const result = parse({ acceptedQuantity: '118', note: '  Two collars re-stitched. ' });
    expect(result.success && result.data).toEqual({
      completedQuantity: 120,
      acceptedQuantity: 118,
      note: 'Two collars re-stitched.',
    });
  });

  it('accepts zero completed pieces, as the backend does', () => {
    expect(parse({ completedQuantity: '0' }).success).toBe(true);
  });

  it('requires the completed quantity', () => {
    expect(firstError({ completedQuantity: '' }, 'completedQuantity')).toBe(
      'Enter how many pieces you completed.',
    );
  });

  it('allows whole numbers only', () => {
    expect(firstError({ completedQuantity: '12.5' }, 'completedQuantity')).toBe(
      'Use whole numbers only.',
    );
    expect(firstError({ completedQuantity: '-3' }, 'completedQuantity')).toBe(
      'Use whole numbers only.',
    );
    expect(firstError({ acceptedQuantity: '1e3' }, 'acceptedQuantity')).toBe(
      'Use whole numbers only.',
    );
  });

  it('does not accept more accepted pieces than completed pieces', () => {
    expect(firstError({ acceptedQuantity: '121' }, 'acceptedQuantity')).toBe(
      'Accepted pieces cannot be more than completed pieces.',
    );
    expect(parse({ acceptedQuantity: '120' }).success).toBe(true);
  });

  it('limits the note to 500 characters', () => {
    expect(parse({ note: 'a'.repeat(NOTE_MAX_LENGTH) }).success).toBe(true);
    expect(firstError({ note: 'a'.repeat(NOTE_MAX_LENGTH + 1) }, 'note')).toBe(
      'Keep the note under 500 characters.',
    );
  });
});
