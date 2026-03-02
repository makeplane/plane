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
import {
  createFilterConfig,
  getAsyncMultiSelectConfig,
  createOperatorConfigEntry,
  getIsNullOperatorConfigEntry,
} from "../../../rich-filters";

/**
 * Parent filter specific params
 */
export type TCreateParentFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<string> & {
    fetchOptions: (params: TAsyncMultiSelectParams) => Promise<TAsyncMultiSelectOptions<string>>;
    fetchSelected: (ids: string[]) => Promise<IFilterOption<string>[]>;
  };

/**
 * Get the parent async multi select config
 */
export const getParentAsyncMultiSelectConfig = <P extends TCreateParentFilterParams>(
  params: P,
  singleValueOperator: TSupportedOperators
) => getAsyncMultiSelectConfig<string>({ singleValueOperator, ...params });

/**
 * Get the parent filter config
 * @template P - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the parent filter config
 */
export const getParentFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateParentFilterParams> =>
  (params: TCreateParentFilterParams) =>
    createFilterConfig<P>({
      id: key,
      label: "Parent",
      ...params,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getParentAsyncMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
        ),
        getIsNullOperatorConfigEntry(params),
      ]),
    });
