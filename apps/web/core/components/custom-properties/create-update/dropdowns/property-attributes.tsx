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

import { observer } from "mobx-react";
// plane imports
import type { CustomProperty, CustomPropertyType, CustomPropertyTypeKey, TOperationMode } from "@plane/types";
// local imports
import type { TCustomPropertyFormError, TCustomPropertyValidator } from "../types";
import { SelectedAttributeProperties } from "./selected-attribute-properties";

type TPropertyAttributesProps = {
  propertyDetail: Partial<CustomProperty<CustomPropertyType>>;
  currentOperationMode: TOperationMode | null;
  onPropertyDetailChange: <K extends keyof CustomProperty<CustomPropertyType>>(
    key: K,
    value: CustomProperty<CustomPropertyType>[K],
    shouldSync?: boolean
  ) => void;
  onPropertyConfigValidityChange?: (isValid: boolean) => void;
  propertyValidator?: TCustomPropertyValidator;
  error?: TCustomPropertyFormError;
  isUpdateAllowed: boolean;
  allProperties?: CustomProperty<CustomPropertyType>[];
  allowedPropertyTypes?: CustomPropertyTypeKey[];
};

export const PropertyAttributes = observer(function PropertyAttributes(props: TPropertyAttributesProps) {
  const {
    propertyDetail,
    currentOperationMode,
    onPropertyDetailChange,
    onPropertyConfigValidityChange,
    propertyValidator,
    error,
    isUpdateAllowed,
    allProperties,
    allowedPropertyTypes,
  } = props;
  // list of property types that should not be allowed to change attributes
  const DISABLE_ATTRIBUTE_CHANGE_LIST: CustomPropertyType[] = ["BOOLEAN", "DATETIME"];

  if (
    !currentOperationMode ||
    !propertyDetail.property_type ||
    DISABLE_ATTRIBUTE_CHANGE_LIST.includes(propertyDetail.property_type)
  )
    return;

  return (
    <div className="flex flex-col gap-2.5">
      <SelectedAttributeProperties
        propertyDetail={propertyDetail}
        currentOperationMode={currentOperationMode}
        onPropertyDetailChange={onPropertyDetailChange}
        onPropertyConfigValidityChange={onPropertyConfigValidityChange}
        propertyValidator={propertyValidator}
        error={error}
        isUpdateAllowed={isUpdateAllowed}
        allProperties={allProperties}
        allowedPropertyTypes={allowedPropertyTypes}
      />
    </div>
  );
});
