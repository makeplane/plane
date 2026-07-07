/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// gizmo imports
import type { TFilterProperty } from "@plane/types";
// local imports
import type { TCreateFilterConfig, TCreateDateFilterParams } from "../../../rich-filters";
import { createFilterConfig, getSupportedDateOperators } from "../../../rich-filters";

// ------------ Date filters ------------

/**
 * Get the start date filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the start date filter config
 */
export const getStartDateFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateDateFilterParams> =>
  (params: TCreateDateFilterParams) =>
    createFilterConfig<P>({
      id: key,
      label: "Дата начала",
      ...params,
      icon: params.filterIcon,
      allowMultipleFilters: true,
      supportedOperatorConfigsMap: getSupportedDateOperators(params),
    });

/**
 * Get the target date filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the target date filter config
 */
export const getTargetDateFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateDateFilterParams> =>
  (params: TCreateDateFilterParams) =>
    createFilterConfig<P>({
      id: key,
      label: "Срок выполнения",
      ...params,
      icon: params.filterIcon,
      allowMultipleFilters: true,
      supportedOperatorConfigsMap: getSupportedDateOperators(params),
    });

/**
 * Get the created at filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the created at filter config
 */
export const getCreatedAtFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateDateFilterParams> =>
  (params: TCreateDateFilterParams) =>
    createFilterConfig<P>({
      id: key,
      label: "Дата создания",
      ...params,
      icon: params.filterIcon,
      allowMultipleFilters: true,
      supportedOperatorConfigsMap: getSupportedDateOperators(params),
    });

/**
 * Get the updated at filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the updated at filter config
 */
export const getUpdatedAtFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateDateFilterParams> =>
  (params: TCreateDateFilterParams) =>
    createFilterConfig<P>({
      id: key,
      label: "Дата обновления",
      ...params,
      icon: params.filterIcon,
      allowMultipleFilters: true,
      supportedOperatorConfigsMap: getSupportedDateOperators(params),
    });
