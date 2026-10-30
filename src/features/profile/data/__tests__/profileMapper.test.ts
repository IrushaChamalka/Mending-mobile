import { profileDtoSchema } from '../dto';
import { toProfile } from '../profileMapper';

describe('toProfile', () => {
  it('keeps the fields the profile shows and ignores the rest of the record', () => {
    const dto = profileDtoSchema.parse({
      id: 'e0f76534-2109-4d45-a4aa-3456789012de',
      userId: 'user00006',
      name: 'Kasun Fernando',
      phone: '+94771234567',
      role: 'EMPLOYEE',
      imageUrl: null,
      age: 28,
      nic: '199612345678',
      createdBy: null,
    });

    expect(toProfile(dto)).toEqual({
      id: 'e0f76534-2109-4d45-a4aa-3456789012de',
      employeeId: 'user00006',
      name: 'Kasun Fernando',
      phone: '+94771234567',
      imageUrl: null,
      age: 28,
      gender: null,
    });
  });

  it('treats blank and missing text as absent', () => {
    const dto = profileDtoSchema.parse({ id: 'id-1', name: '  ', phone: undefined });

    expect(toProfile(dto)).toEqual({
      id: 'id-1',
      employeeId: null,
      name: null,
      phone: null,
      imageUrl: null,
      age: null,
      gender: null,
    });
  });
});
