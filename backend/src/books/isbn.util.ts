import { BadRequestException } from '@nestjs/common';

export function normalizeIsbn13(value: string): string {
  const normalized = value.trim().replace(/[ -]/g, '').toUpperCase();

  if (!/^97[89]\d{10}$/.test(normalized)) {
    throw new BadRequestException('ISBN must be a valid ISBN-13');
  }

  const checksum = normalized
    .slice(0, 12)
    .split('')
    .reduce((sum, digit, index) => sum + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);

  const expected = (10 - (checksum % 10)) % 10;
  if (expected !== Number(normalized[12])) {
    throw new BadRequestException('ISBN must be a valid ISBN-13');
  }

  return normalized;
}
