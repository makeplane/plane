import { E_SILO_ERROR_CODES } from "../types/error";

const entries = Object.entries(E_SILO_ERROR_CODES);

export const SILO_ERROR_CODES = (
  Object.entries(E_SILO_ERROR_CODES) as Array<[keyof typeof E_SILO_ERROR_CODES, string]>
).map((key) => ({
  code: key[1],
  description: key[0].toLowerCase(),
}));
