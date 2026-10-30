import type { Profile } from '../types';

import type { ProfileDto } from './dto';

function textOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function toProfile(dto: ProfileDto): Profile {
  return {
    id: dto.id,
    employeeId: textOrNull(dto.userId),
    name: textOrNull(dto.name),
    phone: textOrNull(dto.phone),
    imageUrl: textOrNull(dto.imageUrl),
    age: dto.age ?? null,
    gender: textOrNull(dto.gender),
  };
}
