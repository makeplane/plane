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
import type { IUserLite, TFilterProperty } from "@plane/types";
import { COLLECTION_OPERATOR, EQUALITY_OPERATOR } from "@plane/types";
// local imports
import { getIsNullOperatorConfigEntry } from "../entries";
import type { TCreateFilterConfig } from "../shared";
import { createFilterConfig, createOperatorConfigEntry } from "../shared";
import type { TCreateUserFilterParams, TCustomPropertyFilterParams } from "./shared";
import { getMemberMultiSelectConfig } from "./shared";

/**
 * Member picker property filter specific params
 */
type TCreateMemberPickerPropertyFilterParams = TCustomPropertyFilterParams<IUserLite> & TCreateUserFilterParams;

/**
 * Get the member picker property filter config
 * @param params - The filter params
 * @returns The member picker property filter config
 */
export const getMemberPickerPropertyFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateMemberPickerPropertyFilterParams> =>
  (params: TCreateMemberPickerPropertyFilterParams) =>
    createFilterConfig({
      id: key,
      ...params,
      label: params.propertyDisplayName,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getMemberMultiSelectConfig(updatedParams, EQUALITY_OPERATOR.EXACT)
        ),
        getIsNullOperatorConfigEntry(params),
      ]),
    });
