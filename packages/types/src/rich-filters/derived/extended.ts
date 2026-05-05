/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TFilterValue } from "../expression";
import type {
  TDateFilterFieldConfig,
  TSingleSelectFilterFieldConfig,
  TMultiSelectFilterFieldConfig,
} from "../field-types";
import type { TExtendedOperatorSpecificConfigs } from "../operator-configs";
import type { TFilterOperatorHelper } from "./shared";

// -------- DATE FILTER OPERATORS --------

/**
 * Union type representing all extended operators that support date filter types.
 * Includes: NOT_EXACT (date), GT, LT
 */
export type TExtendedSupportedDateFilterOperators<V extends TFilterValue = TFilterValue> = {
  [K in keyof TExtendedOperatorSpecificConfigs]: TFilterOperatorHelper<
    TExtendedOperatorSpecificConfigs,
    K,
    TDateFilterFieldConfig<V>
  >;
}[keyof TExtendedOperatorSpecificConfigs];

export type TExtendedAllAvailableDateFilterOperatorsForDisplay<V extends TFilterValue = TFilterValue> =
  TExtendedSupportedDateFilterOperators<V>;

// -------- SELECT FILTER OPERATORS --------

/**
 * Union type representing all extended operators that support single select filter types.
 * Includes: NOT_EXACT (single select)
 */
export type TExtendedSupportedSingleSelectFilterOperators<V extends TFilterValue = TFilterValue> = {
  [K in keyof TExtendedOperatorSpecificConfigs]: TFilterOperatorHelper<
    TExtendedOperatorSpecificConfigs,
    K,
    TSingleSelectFilterFieldConfig<V>
  >;
}[keyof TExtendedOperatorSpecificConfigs];

/**
 * Union type representing all extended operators that support multi select filter types.
 * Includes: NOT_IN
 */
export type TExtendedSupportedMultiSelectFilterOperators<V extends TFilterValue = TFilterValue> = {
  [K in keyof TExtendedOperatorSpecificConfigs]: TFilterOperatorHelper<
    TExtendedOperatorSpecificConfigs,
    K,
    TMultiSelectFilterFieldConfig<V>
  >;
}[keyof TExtendedOperatorSpecificConfigs];

/**
 * Union type representing all extended operators that support any select filter types.
 */
export type TExtendedSupportedSelectFilterOperators<V extends TFilterValue = TFilterValue> =
  | TExtendedSupportedSingleSelectFilterOperators<V>
  | TExtendedSupportedMultiSelectFilterOperators<V>;

export type TExtendedAllAvailableSelectFilterOperatorsForDisplay<V extends TFilterValue = TFilterValue> =
  TExtendedSupportedSelectFilterOperators<V>;
