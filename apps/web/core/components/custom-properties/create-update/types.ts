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

import type {
  CustomProperty,
  CustomPropertyType,
  CustomPropertyOption,
  TWorkItemPropertyPayload,
  TFormulaValidateResponse,
  CustomPropertyTypeKey,
} from "@plane/types";

// Form validation errors
export type TCustomPropertyFormError = {
  [key in keyof CustomProperty<CustomPropertyType>]?: string;
} & {
  options?: string;
};

// Validator callbacks (e.g. formula test)
export type TCustomPropertyValidator = {
  FORMULA?: (formulaWithIds: string) => Promise<TFormulaValidateResponse>;
};

// Actions the modal needs from the parent
export type CustomPropertyCreateUpdateActions = {
  create: (propertyData: TWorkItemPropertyPayload) => Promise<void>;
  update: (propertyId: string, propertyData: TWorkItemPropertyPayload) => Promise<void>;
  getSortedActivePropertyOptions: (propertyId: string) => CustomPropertyOption[] | undefined;
};

// Permissions the parent resolves before opening the modal
export type CustomPropertyCreateUpdatePermissions = {
  canChangePropertyType: boolean;
  allowedPropertyTypes?: CustomPropertyTypeKey[];
};
