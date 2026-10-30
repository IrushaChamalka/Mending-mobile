import type { Profile } from '../types';

export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'e0f76534-2109-4d45-a4aa-3456789012de',
    employeeId: 'user00006',
    name: 'Kasun Fernando',
    phone: '+94771234567',
    imageUrl: null,
    age: 28,
    gender: 'Male',
    ...overrides,
  };
}
