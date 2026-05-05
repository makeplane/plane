/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { TFilterProperty } from "@plane/types";
import {
  EQUALITY_OPERATOR,
  COLLECTION_OPERATOR,
  EXTENDED_COLLECTION_OPERATOR,
  EXTENDED_EQUALITY_OPERATOR,
} from "@plane/types";
// local imports
import type { TCreateFilterConfig, TCreateProjectFilterParams } from "../../../rich-filters";
import { createFilterConfig, createOperatorConfigEntry, getProjectMultiSelectConfig } from "../../../rich-filters";

// ------------ Project filter ------------

/**
 * Get the project filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the project filter config
 */
export const getProjectFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateProjectFilterParams> =>
  (params: TCreateProjectFilterParams) =>
    createFilterConfig<P>({
      id: key,
      label: "Projects",
      ...params,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getProjectMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
        ),
        createOperatorConfigEntry(EXTENDED_COLLECTION_OPERATOR.NOT_IN, params, (updatedParams) =>
          getProjectMultiSelectConfig(updatedParams, EXTENDED_EQUALITY_OPERATOR.NOT_EXACT)
        ),
      ]),
    });
