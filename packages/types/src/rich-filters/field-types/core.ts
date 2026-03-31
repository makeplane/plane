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
import type { TSupportedOperators } from "../operators";
import type { TBaseFilterFieldConfig, IFilterOption, IFilterOptionGroup, TFilterOptionsType } from "./shared";

/**
 * Core filter types
 */
export const CORE_FILTER_FIELD_TYPE = {
  DATE: "date",
  DATE_RANGE: "date_range",
  SINGLE_SELECT: "single_select",
  MULTI_SELECT: "multi_select",
  ASYNC_MULTI_SELECT: "async_multi_select",
} as const;

// -------- DATE FILTER CONFIGURATIONS --------

type TBaseDateFilterFieldConfig = TBaseFilterFieldConfig & {
  min?: Date;
  max?: Date;
};

/**
 * Date filter configuration - for temporal filtering.
 * - defaultValue: Initial date/time value
 * - min: Minimum allowed date
 * - max: Maximum allowed date
 */
export type TDateFilterFieldConfig<V extends TFilterValue> = TBaseDateFilterFieldConfig & {
  type: typeof CORE_FILTER_FIELD_TYPE.DATE;
  defaultValue?: V;
};

/**
 * Date range filter configuration - for temporal filtering.
 * - defaultValue: Initial date/time range values
 * - min: Minimum allowed date
 * - max: Maximum allowed date
 */
export type TDateRangeFilterFieldConfig<V extends TFilterValue> = TBaseDateFilterFieldConfig & {
  type: typeof CORE_FILTER_FIELD_TYPE.DATE_RANGE;
  defaultValue?: V[];
};

// -------- SELECT FILTER CONFIGURATIONS --------

/**
 * The resolved value from `getOptions` for a given `optionsType`.
 * - flat-list: plain array of options
 * - group: array of option groups
 */
type TGetOptionsResult<V extends TFilterValue, T extends TFilterOptionsType> = T extends "group"
  ? IFilterOptionGroup<V>[]
  : IFilterOption<V>[];

/**
 * Single-select filter configuration - dropdown with one selectable option.
 * - defaultValue: Initial selected value
 * - optionsType: Controls whether options are flat or grouped (default: "flat-list")
 * - getOptions: Options as static array or async function
 */
export type TSingleSelectFilterFieldConfig<
  V extends TFilterValue,
  T extends TFilterOptionsType = "flat-list",
> = TBaseFilterFieldConfig & {
  type: typeof CORE_FILTER_FIELD_TYPE.SINGLE_SELECT;
  optionsType?: T;
  defaultValue?: V;
  getOptions: TGetOptionsResult<V, T> | (() => TGetOptionsResult<V, T> | Promise<TGetOptionsResult<V, T>>);
};

/**
 * Multi-select filter configuration - allows selecting multiple options.
 * - defaultValue: Initial selected values array
 * - optionsType: Controls whether options are flat or grouped (default: "flat-list")
 * - getOptions: Options as static array or async function
 * - singleValueOperator: Operator to show when single value is selected
 */
export type TMultiSelectFilterFieldConfig<
  V extends TFilterValue,
  T extends TFilterOptionsType = "flat-list",
> = TBaseFilterFieldConfig & {
  type: typeof CORE_FILTER_FIELD_TYPE.MULTI_SELECT;
  optionsType?: T;
  defaultValue?: V[];
  singleValueOperator: TSupportedOperators;
} & Pick<TSingleSelectFilterFieldConfig<V, T>, "getOptions">;

// -------- ASYNC MULTI SELECT --------

/**
 * Params for fetching async multi-select options.
 */
export type TAsyncMultiSelectParams = { search: string; cursor: string; per_page: string };

/**
 * Result of fetching async multi-select options.
 */
export type TAsyncMultiSelectOptions<V extends TFilterValue = string> = {
  results: IFilterOption<V>[];
  next_cursor: string;
};

/**
 * Async multi-select filter configuration
 * - defaultValue: Initial selected values array (ids)
 * - fetchOptions: Fetches options with params
 * - fetchSelected: Fetches options with selected ids
 * - singleValueOperator: Operator to show when single value is selected
 */
export type TAsyncMultiSelectFilterFieldConfig<V extends TFilterValue = string> = TBaseFilterFieldConfig & {
  type: typeof CORE_FILTER_FIELD_TYPE.ASYNC_MULTI_SELECT;
  defaultValue?: V[];
  fetchOptions: (params: TAsyncMultiSelectParams) => Promise<TAsyncMultiSelectOptions<V>>;
  fetchSelected: (ids: string[]) => Promise<IFilterOption<V>[]>;
  singleValueOperator: TSupportedOperators;
};

// -------- UNION TYPES --------

/**
 * All core filter configurations
 */
export type TCoreFilterFieldConfigs<V extends TFilterValue = TFilterValue> =
  | TDateFilterFieldConfig<V>
  | TDateRangeFilterFieldConfig<V>
  | TSingleSelectFilterFieldConfig<V>
  | TSingleSelectFilterFieldConfig<V, "group">
  | TMultiSelectFilterFieldConfig<V>
  | TMultiSelectFilterFieldConfig<V, "group">
  | TAsyncMultiSelectFilterFieldConfig<V>;
