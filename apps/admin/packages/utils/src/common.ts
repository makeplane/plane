import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CompleteOrEmpty } from "@plane/types";

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

/**
 * Checks if an object is complete (has properties) rather than empty.
 * This helps TypeScript narrow the type from CompleteOrEmpty<T> to T.
 *
 * @param obj The object to check, typed as CompleteOrEmpty<T>
 * @returns A boolean indicating if the object is complete (true) or empty (false)
 */
export const isComplete = <T>(obj: CompleteOrEmpty<T>): obj is T => {
  // Check if object is not null or undefined
  if (obj == null) return false;

  // Check if it's an object
  if (typeof obj !== "object") return false;

  // Check if it has any own properties
  return Object.keys(obj).length > 0;
};

export const convertRemToPixel = (rem: number): number => rem * 0.9 * 16;
