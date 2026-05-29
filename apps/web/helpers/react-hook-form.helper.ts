import type { FieldError, FieldValues } from "react-hook-form";

/**
 * Get a nested error from a form's errors object
 * @param errors - The form's errors object
 * @param path - The path to the error
 * @returns The error or undefined if not found
 */
export const getNestedError = <T extends FieldValues>(errors: T, path: string): FieldError | undefined => {
  const keys = path.split(".");
  let current: unknown = errors;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  // Check if the final value is a FieldError
  if (current && typeof current === "object" && "message" in current) {
    return current as FieldError;
  }

  return undefined;
};
