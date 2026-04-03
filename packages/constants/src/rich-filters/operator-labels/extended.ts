/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TExtendedSupportedOperators } from "@plane/types";
import { EXTENDED_EQUALITY_OPERATOR, EXTENDED_COLLECTION_OPERATOR, EXTENDED_COMPARISON_OPERATOR } from "@plane/types";

/**
 * Extended operator labels — generic labels for all field types
 */
export const EXTENDED_OPERATOR_LABELS_MAP: Record<TExtendedSupportedOperators, string> = {
  [EXTENDED_EQUALITY_OPERATOR.NOT_EXACT]: "is not",
  [EXTENDED_COLLECTION_OPERATOR.NOT_IN]: "is not any of",
  [EXTENDED_COMPARISON_OPERATOR.GT]: "greater than",
  [EXTENDED_COMPARISON_OPERATOR.LT]: "less than",
  [EXTENDED_COMPARISON_OPERATOR.TODAY]: "today",
} as const;

/**
 * Extended date-specific operator labels
 * Used when the filter field is a date type
 */
export const EXTENDED_DATE_OPERATOR_LABELS_MAP: Record<TExtendedSupportedOperators, string> = {
  [EXTENDED_EQUALITY_OPERATOR.NOT_EXACT]: "is not",
  [EXTENDED_COLLECTION_OPERATOR.NOT_IN]: "is not any of",
  [EXTENDED_COMPARISON_OPERATOR.GT]: "greater than",
  [EXTENDED_COMPARISON_OPERATOR.LT]: "less than",
  [EXTENDED_COMPARISON_OPERATOR.TODAY]: "today",
} as const;

/**
 * Negated operator labels — not used with this approach
 * (not_exact and not_in are standalone operators, not negated versions)
 */
export const NEGATED_OPERATOR_LABELS_MAP: Record<never, string> = {} as const;

/**
 * Negated date operator labels — not used with this approach
 */
export const NEGATED_DATE_OPERATOR_LABELS_MAP: Record<never, string> = {} as const;
