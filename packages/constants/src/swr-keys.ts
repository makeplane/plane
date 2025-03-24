export enum SWR_KEYS_CORE {}

export const SWR_KEYS = {
  ...SWR_KEYS_CORE,
} as const;

export type TSWRKey = SWR_KEYS_CORE;
