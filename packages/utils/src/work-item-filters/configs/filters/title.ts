/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TFilterProperty } from "@plane/types";
import { CORE_TEXT_OPERATOR, FILTER_FIELD_TYPE } from "@plane/types";
import type { TCreateFilterConfigParams, IFilterIconConfig, TCreateFilterConfig } from "../../../rich-filters";
import { createFilterConfig, createFilterFieldConfig, createOperatorConfigEntry } from "../../../rich-filters";

type TCreateTitleFilterParams = TCreateFilterConfigParams & IFilterIconConfig;

/**
 * Create a Title filter factory with a scalar, case-insensitive substring operator.
 * @param key - The work-item property to bind the filter to.
 * @returns A factory accepting filter enablement, operator and icon options.
 */
export const getTitleFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateTitleFilterParams> =>
  (params) =>
    createFilterConfig<P>({
      id: key,
      label: "Title",
      ...params,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(CORE_TEXT_OPERATOR.ICONTAINS, params, (updatedParams) =>
          createFilterFieldConfig<typeof FILTER_FIELD_TYPE.TEXT, string>({
            ...updatedParams,
            type: FILTER_FIELD_TYPE.TEXT,
            placeholder: "Enter title",
          })
        ),
      ]),
    });
