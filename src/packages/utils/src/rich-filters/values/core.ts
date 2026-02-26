/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { SingleOrArray, TFilterValue } from "@plane/types";

/**
 * Converts any value to a non-null array for UI components that expect arrays
 * Returns empty array for null/undefined values
 */
export const toFilterArray = <V extends TFilterValue>(value: SingleOrArray<V>): NonNullable<V>[] => {
  if (value === null || value === undefined) {
    return [];
  }

  return Array.isArray(value) ? (value as NonNullable<V>[]) : ([value] as NonNullable<V>[]);
};

/**
 * Gets the length of a filter value
 */
export const getFilterValueLength = <V extends TFilterValue>(value: SingleOrArray<V>): number => {
  if (value === null || value === undefined) {
    return 0;
  }

  return Array.isArray(value) ? value.length : 1;
};
