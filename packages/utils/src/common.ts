import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Support email can be configured by the application
export const getSupportEmail = (defaultEmail: string = ""): string => defaultEmail;

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/**
 * Extracts IDs from an array of objects with ID property
 */
export const extractIds = <T extends { id: string }>(items: T[]): string[] => items.map((item) => item.id);

/**
 * Checks if an ID exists and is valid within the provided list
 */
export const isValidId = (id: string | null | undefined, validIds: string[]): boolean => !!id && validIds.includes(id);

/**
 * Filters an array to only include valid IDs
 */
export const filterValidIds = (ids: string[], validIds: string[]): string[] =>
  ids.filter((id) => validIds.includes(id));

/**
 * Filters an array to include only valid IDs, returning both valid and invalid IDs
 */
export const partitionValidIds = (ids: string[], validIds: string[]): { valid: string[]; invalid: string[] } => {
  const valid: string[] = [];
  const invalid: string[] = [];

  ids.forEach((id) => {
    if (validIds.includes(id)) {
      valid.push(id);
    } else {
      invalid.push(id);
    }
  });

  return { valid, invalid };
};
