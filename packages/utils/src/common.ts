/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import type { CompleteOrEmpty, TApiErrorResponse, TError } from "@plane/types";

// Support email can be configured by the application
export const getSupportEmail = (defaultEmail: string = ""): string => defaultEmail;

// Matches custom typography classes: text-h1-semibold, text-body-md-regular, text-caption-xs-medium, etc.
const isCustomTypography = (value: string) =>
  !/^(h[1-6]|body-(xs|sm|md)|caption-(xs|sm|md))-(regular|medium|semibold|bold)$/.test(value);

// Matches custom font size classes: text-9, text-10, text-11, text-12, text-13, text-14, text-16, text-18, text-20, text-24, text-28, text-32, text-40
const isCustomFontSize = (value: string) => /^(9|10|11|12|13|14|16|18|20|24|28|32|40)$/.test(value);

// Matches custom text color classes: text-primary, text-on-color, text-secondary, etc.
const CUSTOM_TEXT_COLORS = [
  "primary",
  "secondary",
  "tertiary",
  "placeholder",
  "disabled",
  "accent-primary",
  "accent-secondary",
  "on-color",
  "on-color-disabled",
  "inverse",
  "success",
  "success-primary",
  "success-secondary",
  "warning",
  "warning-primary",
  "warning-secondary",
  "danger",
  "danger-primary",
  "danger-secondary",
];
const isCustomTextColor = (value: string) => CUSTOM_TEXT_COLORS.includes(value);

const twMerge = extendTailwindMerge<"custom-typography" | "custom-text-color">({
  override: {
    classGroups: {
      // Override font-size to include custom numeric sizes and exclude custom typography/colors
      "font-size": [
        {
          text: [
            (value: string) => isCustomFontSize(value) || (!isCustomTypography(value) && !isCustomTextColor(value)),
          ],
        },
      ],
    },
  },
  extend: {
    classGroups: {
      // Custom typography in its own group
      "custom-typography": [{ text: [isCustomTypography] }],
      // Custom text colors in their own group (won't conflict with font sizes)
      "custom-text-color": [{ text: [isCustomTextColor] }],
    },
  },
});

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

export const isApiError = (err: unknown): err is TApiErrorResponse =>
  typeof err === "object" &&
  err !== null &&
  "code" in err &&
  typeof (err as Record<string, unknown>).code === "string" &&
  "error" in err &&
  typeof (err as Record<string, unknown>).error === "string";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 *  Calculates the final sort_order for the movedItem
 * @param data Objects in updated order
 * @param movedItemId Item that is moved to re-order
 */
export const calculateSortOrder = (
  data: { id: string; sort_order: number }[],
  movedItemId: string
): number | undefined => {
  const movedItemIndex = data.findIndex((item) => item.id === movedItemId);
  const DEFAULT_SORT_ORDER = 10000;

  if (movedItemIndex === -1) return;

  // Get previous and next items' sort_order
  const prevSortOrder = data[movedItemIndex - 1]?.sort_order;
  const nextSortOrder = data[movedItemIndex + 1]?.sort_order;

  // Item is moved to top
  if (prevSortOrder === undefined) return (nextSortOrder ?? DEFAULT_SORT_ORDER) / 2;
  // Item is moved to end
  if (nextSortOrder === undefined) return prevSortOrder + DEFAULT_SORT_ORDER;
  // Item is moved to middle
  return (prevSortOrder + nextSortOrder) / 2;
};

/**
 * Parses Django REST / DRF serializer validation shapes like
 * `{ "name": ["A cycle with the name … already exists."] }` or nested equivalents.
 * Returns the first non-empty string message found in deterministic object key order.
 */
const extractDjangoFieldErrorMessage = (payload: unknown, skipKeys?: ReadonlySet<string>): string | undefined => {
  if (!isRecord(payload)) return undefined;
  for (const [key, value] of Object.entries(payload)) {
    if (skipKeys?.has(key)) continue;
    if (typeof value === "string" && value) return value;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item) return item;
        const nested = extractDjangoFieldErrorMessage(item);
        if (nested) return nested;
      }
    } else if (isRecord(value)) {
      const nested = extractDjangoFieldErrorMessage(value);
      if (nested) return nested;
    }
  }
  return undefined;
};

/** Keys often present on API error envelopes; skip only for a top-level field-error sweep. */
const ERROR_ENVELOPE_KEYS = new Set(["code", "status", "error", "detail", "message"]);

export const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (!isRecord(error)) {
    if (error instanceof Error) return error.message;
    return fallbackMessage;
  }

  const errorObj = error as TError & Record<string, unknown>;

  const errorField = errorObj.error;
  if (typeof errorField === "string" && errorField) return errorField;
  const fromErrorObject = extractDjangoFieldErrorMessage(errorField);
  if (fromErrorObject) return fromErrorObject;

  const detailField = errorObj.detail;
  if (typeof detailField === "string" && detailField) return detailField;
  if (Array.isArray(detailField)) {
    const firstDetail = detailField.find((item): item is string => typeof item === "string" && !!item);
    if (firstDetail) return firstDetail;
  }

  const messageField = errorObj.message;
  if (typeof messageField === "string" && messageField) return messageField;

  const fromRoot = extractDjangoFieldErrorMessage(errorObj, ERROR_ENVELOPE_KEYS);
  if (fromRoot) return fromRoot;

  return fallbackMessage;
};

export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
