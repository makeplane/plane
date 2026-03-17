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

import type { TFilterValue } from "../expression";
import type {
  TDateFilterFieldConfig,
  TDateRangeFilterFieldConfig,
  TSingleSelectFilterFieldConfig,
  TMultiSelectFilterFieldConfig,
  TAsyncMultiSelectFilterFieldConfig,
} from "../field-types";
import type { TCoreOperatorSpecificConfigs } from "../operator-configs";
import type { TFilterOperatorHelper } from "./shared";

// -------- DATE FILTER OPERATORS --------

/**
 * Union type representing all core operators that support single date filter types.
 */
export type TCoreSupportedSingleDateFilterOperators<V extends TFilterValue = TFilterValue> = {
  [K in keyof TCoreOperatorSpecificConfigs]: TFilterOperatorHelper<
    TCoreOperatorSpecificConfigs,
    K,
    TDateFilterFieldConfig<V>
  >;
}[keyof TCoreOperatorSpecificConfigs];

/**
 * Union type representing all core operators that support range date filter types.
 */
export type TCoreSupportedRangeDateFilterOperators<V extends TFilterValue = TFilterValue> = {
  [K in keyof TCoreOperatorSpecificConfigs]: TFilterOperatorHelper<
    TCoreOperatorSpecificConfigs,
    K,
    TDateRangeFilterFieldConfig<V>
  >;
}[keyof TCoreOperatorSpecificConfigs];

/**
 * Union type representing all core operators that support date filter types.
 */
export type TCoreSupportedDateFilterOperators<V extends TFilterValue = TFilterValue> =
  | TCoreSupportedSingleDateFilterOperators<V>
  | TCoreSupportedRangeDateFilterOperators<V>;

export type TCoreAllAvailableDateFilterOperatorsForDisplay<V extends TFilterValue = TFilterValue> =
  TCoreSupportedDateFilterOperators<V>;

// -------- SELECT FILTER OPERATORS --------

/**
 * Union type representing all core operators that support single select filter types.
 */
export type TCoreSupportedSingleSelectFilterOperators<V extends TFilterValue = TFilterValue> = {
  [K in keyof TCoreOperatorSpecificConfigs]: TFilterOperatorHelper<
    TCoreOperatorSpecificConfigs,
    K,
    TSingleSelectFilterFieldConfig<V>
  >;
}[keyof TCoreOperatorSpecificConfigs];

/**
 * Union type representing all core operators that support multi select filter types.
 */
export type TCoreSupportedMultiSelectFilterOperators<V extends TFilterValue = TFilterValue> = {
  [K in keyof TCoreOperatorSpecificConfigs]: TFilterOperatorHelper<
    TCoreOperatorSpecificConfigs,
    K,
    TMultiSelectFilterFieldConfig<V>
  >;
}[keyof TCoreOperatorSpecificConfigs];

/**
 * Union type representing all core operators that support async multi select filter types.
 */
export type TCoreSupportedAsyncMultiSelectFilterOperators<V extends TFilterValue = TFilterValue> = {
  [K in keyof TCoreOperatorSpecificConfigs]: TFilterOperatorHelper<
    TCoreOperatorSpecificConfigs,
    K,
    TAsyncMultiSelectFilterFieldConfig<V>
  >;
}[keyof TCoreOperatorSpecificConfigs];

/**
 * Union type representing all core operators that support any select filter types.
 */
export type TCoreSupportedSelectFilterOperators<V extends TFilterValue = TFilterValue> =
  | TCoreSupportedSingleSelectFilterOperators<V>
  | TCoreSupportedMultiSelectFilterOperators<V>
  | TCoreSupportedAsyncMultiSelectFilterOperators<V>;

export type TCoreAllAvailableSelectFilterOperatorsForDisplay<V extends TFilterValue = TFilterValue> =
  TCoreSupportedSelectFilterOperators<V>;
