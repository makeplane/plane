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

// plane imports
import type { Release, TFilterProperty } from "@plane/types";
import { EQUALITY_OPERATOR, COLLECTION_OPERATOR } from "@plane/types";
// local imports
import type { TCreateFilterConfigParams, IFilterIconConfig, TCreateFilterConfig } from "../../../rich-filters";
import {
  createFilterConfig,
  getMultiSelectConfig,
  createOperatorConfigEntry,
  getIsNullOperatorConfigEntry,
} from "../../../rich-filters";

/**
 * Release filter specific params
 */
export type TCreateReleaseFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<undefined> & {
    releases: Release[];
  };

/**
 * Helper to get the release multi select config
 * @param params - The filter params
 * @returns The release multi select config
 */
export const getReleaseMultiSelectConfig = (params: TCreateReleaseFilterParams) =>
  getMultiSelectConfig<Release, string, undefined>(
    {
      items: params.releases,
      getId: (release) => release.id,
      getLabel: (release) => release.name,
      getValue: (release) => release.id,
      getIconData: () => undefined,
    },
    {
      singleValueOperator: EQUALITY_OPERATOR.EXACT,
      ...params,
    },
    {
      ...params,
    }
  );

/**
 * Get the release filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the release filter config
 */
export const getReleaseFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateReleaseFilterParams> =>
  (params: TCreateReleaseFilterParams) =>
    createFilterConfig({
      id: key,
      label: "Release",
      ...params,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getReleaseMultiSelectConfig(updatedParams)
        ),
        getIsNullOperatorConfigEntry(params),
      ]),
    });
