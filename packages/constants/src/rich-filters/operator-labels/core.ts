/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TCoreSupportedOperators, TCoreSupportedDateFilterOperators } from "@plane/types";
import { CORE_EQUALITY_OPERATOR, CORE_COLLECTION_OPERATOR, CORE_COMPARISON_OPERATOR } from "@plane/types";

/**
 * Core operator labels
 */
export const CORE_OPERATOR_LABELS_MAP: Record<TCoreSupportedOperators, string> = {
  [CORE_EQUALITY_OPERATOR.EXACT]: "is",
  [CORE_COLLECTION_OPERATOR.IN]: "is any of",
  [CORE_COMPARISON_OPERATOR.RANGE]: "between",
} as const;

/**
 * Core date-specific operator labels
 */
export const CORE_DATE_OPERATOR_LABELS_MAP: Record<TCoreSupportedDateFilterOperators, string> = {
  [CORE_EQUALITY_OPERATOR.EXACT]: "is",
  [CORE_COMPARISON_OPERATOR.RANGE]: "between",
} as const;

/**
 * Translation keys for the core operator labels
 */
export const CORE_OPERATOR_LABEL_I18N_KEYS_MAP: Record<TCoreSupportedOperators, string> = {
  [CORE_EQUALITY_OPERATOR.EXACT]: "rich_filters.operators.is",
  [CORE_COLLECTION_OPERATOR.IN]: "rich_filters.operators.is_any_of",
  [CORE_COMPARISON_OPERATOR.RANGE]: "rich_filters.operators.between",
} as const;

/**
 * Translation keys for the core date-specific operator labels
 */
export const CORE_DATE_OPERATOR_LABEL_I18N_KEYS_MAP: Record<TCoreSupportedDateFilterOperators, string> = {
  [CORE_EQUALITY_OPERATOR.EXACT]: "rich_filters.operators.is",
  [CORE_COMPARISON_OPERATOR.RANGE]: "rich_filters.operators.between",
} as const;
