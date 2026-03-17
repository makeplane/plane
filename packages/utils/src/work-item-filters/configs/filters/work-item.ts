/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// plane imports
import type {
  IFilterOption,
  TAsyncMultiSelectOptions,
  TAsyncMultiSelectParams,
  TFilterProperty,
  TSupportedOperators,
} from "@plane/types";
import { COLLECTION_OPERATOR, EQUALITY_OPERATOR } from "@plane/types";
// local imports
import type { TCreateFilterConfigParams, TCreateFilterConfig, IFilterIconConfig } from "../../../rich-filters";
import { createFilterConfig, getAsyncMultiSelectConfig, createOperatorConfigEntry } from "../../../rich-filters";

/**
 * Work item filter specific params
 */
export type TCreateWorkItemFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<string> & {
    fetchOptions: (params: TAsyncMultiSelectParams) => Promise<TAsyncMultiSelectOptions<string>>;
    fetchSelected: (ids: string[]) => Promise<IFilterOption<string>[]>;
  };

/**
 * Get the work item async multi select config
 */
export const getWorkItemAsyncMultiSelectConfig = <P extends TCreateWorkItemFilterParams>(
  params: P,
  singleValueOperator: TSupportedOperators
) => getAsyncMultiSelectConfig<string>({ singleValueOperator, ...params });

/**
 * Get the work item filter config
 * @template P - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the work item filter config
 */
export const getWorkItemFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateWorkItemFilterParams> =>
  (params: TCreateWorkItemFilterParams) =>
    createFilterConfig<P>({
      id: key,
      label: "Work items",
      ...params,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getWorkItemAsyncMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
        ),
      ]),
    });
