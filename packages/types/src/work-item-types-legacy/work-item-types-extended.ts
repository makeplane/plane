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

import type { EIssuePropertyType, IIssueProperty } from "./work-item-properties";
import type { CustomPropertyTypeKey } from "../work-item-types/work-item-property-configurations";
import type { IIssueType } from "./work-item-types";
import type { TIssuePropertySerializedEntry } from "../work-item-types/work-item-types";

export type TIssuePropertyDisplayEntry = {
  property: IIssueProperty<EIssuePropertyType>;
  propertyId: string;
  propertyTypeKey: CustomPropertyTypeKey;
  displayValues: string[];
};

export type TIssuePropertyDisplayContext = {
  entries: TIssuePropertySerializedEntry[];
  workItemType?: IIssueType;
};
