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
import type { TEpicMeta, TFilterProperty, TSupportedOperators } from "@plane/types";
import { EQUALITY_OPERATOR, COLLECTION_OPERATOR } from "@plane/types";
// local imports
import { formatProjectWorkItemIdentifierForDisplay } from "../../../project";
import type { TCreateFilterConfigParams, IFilterIconConfig, TCreateFilterConfig } from "../../../rich-filters";
import {
  createFilterConfig,
  getMultiSelectConfig,
  createOperatorConfigEntry,
  getIsNullOperatorConfigEntry,
} from "../../../rich-filters";

/**
 * Epic filter specific params
 */
export type TCreateEpicFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<TEpicMeta> & {
    epics: TEpicMeta[];
  };

/**
 * Helper to get the epic multi select config
 * @param params - The filter params
 * @returns The epic multi select config
 */
export const getEpicMultiSelectConfig = (params: TCreateEpicFilterParams, singleValueOperator: TSupportedOperators) =>
  getMultiSelectConfig<TEpicMeta, string, TEpicMeta>(
    {
      items: params.epics.filter(Boolean).filter((epic) => epic.id && epic.name),
      getId: (epic) => epic.id,
      getLabel: (epic) =>
        `${formatProjectWorkItemIdentifierForDisplay(epic.project_identifier, epic.sequence_id)} ${epic.name}`,
      getValue: (epic) => epic.id,
      getIconData: (epic) => epic,
    },
    {
      singleValueOperator,
      ...params,
    },
    {
      ...params,
    }
  );

/**
 * Get the epic filter config
 * @template K - The filter key
 * @param key - The filter key to use
 * @returns A function that takes parameters and returns the epic filter config
 */
export const getEpicFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateEpicFilterParams> =>
  (params: TCreateEpicFilterParams) =>
    createFilterConfig({
      id: key,
      label: "Epics",
      ...params,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getEpicMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
        ),
        getIsNullOperatorConfigEntry(params),
      ]),
    });
