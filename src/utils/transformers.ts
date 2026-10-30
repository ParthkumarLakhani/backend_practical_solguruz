import { ValueTransformer } from 'typeorm';

export const bigintTransformer: ValueTransformer = {
  to: (value: number | null | undefined) => value,
  from: (value: string | null): number | null =>
    value === null ? null : Number(value),
};