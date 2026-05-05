/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TFilterValue } from "../expression";
import type {
  TSingleSelectFilterFieldConfig,
  TMultiSelectFilterFieldConfig,
  TDateFilterFieldConfig,
} from "../field-types";
import type {
  EXTENDED_EQUALITY_OPERATOR,
  EXTENDED_COLLECTION_OPERATOR,
  EXTENDED_COMPARISON_OPERATOR,
} from "../operators";

// ----------------------------- EXACT Operator -----------------------------
export type TExtendedExactOperatorConfigs = never;

// ----------------------------- IN Operator -----------------------------
export type TExtendedInOperatorConfigs = never;

// ----------------------------- RANGE Operator -----------------------------
export type TExtendedRangeOperatorConfigs = never;

// ----------------------------- NOT_EXACT Operator -----------------------------
/**
 * not_exact: accepts a single value (single select or date)
 */
export type TExtendedNotExactOperatorConfigs =
  | TSingleSelectFilterFieldConfig<TFilterValue>
  | TDateFilterFieldConfig<TFilterValue>;

// ----------------------------- NOT_IN Operator -----------------------------
/**
 * not_in: accepts multiple values (multi-select), with singleValueOperator = NOT_EXACT
 * Updated: Validation Session 3 - singleValueOperator declared at type level
 */
export type TExtendedNotInOperatorConfigs = TMultiSelectFilterFieldConfig<TFilterValue> & {
  singleValueOperator: typeof EXTENDED_EQUALITY_OPERATOR.NOT_EXACT;
};

// ----------------------------- GT Operator -----------------------------
/**
 * gt: accepts a single date value (date picker)
 */
export type TExtendedGtOperatorConfigs = TDateFilterFieldConfig<TFilterValue>;

// ----------------------------- LT Operator -----------------------------
/**
 * lt: accepts a single date value (date picker)
 */
export type TExtendedLtOperatorConfigs = TDateFilterFieldConfig<TFilterValue>;

// ----------------------------- TODAY Operator -----------------------------
/**
 * today: uses today's date automatically (no user input needed)
 * Serialized as "exact" with current date value
 */
export type TExtendedTodayOperatorConfigs = TDateFilterFieldConfig<TFilterValue>;

// ----------------------------- Extended Operator Specific Configs -----------------------------
export type TExtendedOperatorSpecificConfigs = {
  [EXTENDED_EQUALITY_OPERATOR.NOT_EXACT]: TExtendedNotExactOperatorConfigs;
  [EXTENDED_COLLECTION_OPERATOR.NOT_IN]: TExtendedNotInOperatorConfigs;
  [EXTENDED_COMPARISON_OPERATOR.GT]: TExtendedGtOperatorConfigs;
  [EXTENDED_COMPARISON_OPERATOR.LT]: TExtendedLtOperatorConfigs;
  [EXTENDED_COMPARISON_OPERATOR.TODAY]: TExtendedTodayOperatorConfigs;
};
