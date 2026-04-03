/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TAllAvailableOperatorsForDisplay, TSupportedOperators } from "@plane/types";
import {
  EXTENDED_EQUALITY_OPERATOR,
  EXTENDED_COLLECTION_OPERATOR,
  EQUALITY_OPERATOR,
  COLLECTION_OPERATOR,
} from "@plane/types";

/**
 * Result type for operator conversion
 */
export type TOperatorForPayload = {
  operator: TSupportedOperators;
  isNegation: boolean;
};

/**
 * Converts a display operator to the format needed for supported by filter expression condition.
 * For negated operators (not_exact, not_in), maps them back to their base operator
 * and sets isNegation=true so the adapter can wrap them in {"not": {...}}.
 * For "today", maps to "exact" with no negation (value is computed at serialization time).
 * For gt, lt, exact, in, range — pass through with isNegation=false.
 *
 * @param displayOperator - The operator from the UI
 * @returns Object with supported operator and negation flag
 */
export const getOperatorForPayload = (displayOperator: TAllAvailableOperatorsForDisplay): TOperatorForPayload => {
  switch (displayOperator) {
    case EXTENDED_EQUALITY_OPERATOR.NOT_EXACT:
      return { operator: EQUALITY_OPERATOR.EXACT, isNegation: true };
    case EXTENDED_COLLECTION_OPERATOR.NOT_IN:
      return { operator: COLLECTION_OPERATOR.IN, isNegation: true };
    default:
      // gt, lt, today, exact, in, range → no negation, pass through
      return { operator: displayOperator as TSupportedOperators, isNegation: false };
  }
};
