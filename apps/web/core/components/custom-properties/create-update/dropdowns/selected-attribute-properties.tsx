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
import { getCustomPropertyTypeKey } from "@plane/utils";
// local imports
import { BooleanAttributes } from "../attributes/boolean";
import { DatePickerAttributes } from "../attributes/date-picker";
import { DropdownAttributes } from "../attributes/dropdown";
import { MemberPickerAttributes } from "../attributes/member-picker";
import { NumberAttributes } from "../attributes/number";
import { TextAttributes } from "../attributes/text";
import { FormulaAttributes } from "../attributes/formula";
import type { TCustomPropertyFormError, TCustomPropertyValidator } from "../types";

type TSelectedPropertyAttributesProps = {
  propertyDetail: Partial<CustomProperty<CustomPropertyType>>;
  currentOperationMode: TOperationMode;
  onPropertyDetailChange: <K extends keyof CustomProperty<CustomPropertyType>>(
    key: K,
    value: CustomProperty<CustomPropertyType>[K],
    shouldSync?: boolean
  ) => void;
  onPropertyConfigValidityChange?: (isValid: boolean) => void;
  propertyValidator?: TCustomPropertyValidator;
  disabled?: boolean;
  error?: TCustomPropertyFormError;
  isUpdateAllowed: boolean;
  allProperties?: CustomProperty<CustomPropertyType>[];
  allowedPropertyTypes?: CustomPropertyTypeKey[];
};

export const SelectedAttributeProperties = observer(function SelectedAttributeProperties(
  props: TSelectedPropertyAttributesProps
) {
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

  const ISSUE_PROPERTY_ATTRIBUTE_DETAILS: Partial<Record<CustomPropertyTypeKey, React.ReactNode>> = {
    TEXT: (
      <TextAttributes
        textPropertyDetail={propertyDetail as Partial<CustomProperty<"TEXT">>}
        currentOperationMode={currentOperationMode}
        onTextDetailChange={onPropertyDetailChange}
        isUpdateAllowed={isUpdateAllowed}
      />
    ),
    DECIMAL: (
      <NumberAttributes
        numberPropertyDetail={propertyDetail as Partial<CustomProperty<"DECIMAL">>}
        currentOperationMode={currentOperationMode}
        onNumberDetailChange={onPropertyDetailChange}
        isUpdateAllowed={isUpdateAllowed}
      />
    ),
    OPTION: (
      <DropdownAttributes
        dropdownPropertyDetail={propertyDetail as Partial<CustomProperty<"OPTION">>}
        currentOperationMode={currentOperationMode}
        onDropdownDetailChange={onPropertyDetailChange}
        error={error}
        isUpdateAllowed={isUpdateAllowed}
      />
    ),
    BOOLEAN: (
      <BooleanAttributes
        booleanPropertyDetail={propertyDetail as Partial<CustomProperty<"BOOLEAN">>}
        currentOperationMode={currentOperationMode}
        onBooleanDetailChange={onPropertyDetailChange}
        isUpdateAllowed={isUpdateAllowed}
      />
    ),
    DATETIME: (
      <DatePickerAttributes
        datePickerPropertyDetail={propertyDetail as Partial<CustomProperty<"DATETIME">>}
        currentOperationMode={currentOperationMode}
        onDatePickerDetailChange={onPropertyDetailChange}
        isUpdateAllowed={isUpdateAllowed}
      />
    ),
    RELATION_USER: (
      <MemberPickerAttributes
        memberPickerPropertyDetail={propertyDetail as Partial<CustomProperty<"RELATION">>}
        currentOperationMode={currentOperationMode}
        onMemberPickerDetailChange={onPropertyDetailChange}
        isUpdateAllowed={isUpdateAllowed}
      />
    ),
    FORMULA: (
      <FormulaAttributes
        formulaPropertyDetail={propertyDetail as Partial<CustomProperty<"FORMULA">>}
        currentOperationMode={currentOperationMode}
        onFormulaDetailChange={onPropertyDetailChange}
        onPropertyConfigValidityChange={onPropertyConfigValidityChange}
        onValidateFormula={propertyValidator?.FORMULA}
        isUpdateAllowed={isUpdateAllowed}
        allProperties={allProperties}
      />
    ),
  };

  const propertyTypeKey = getCustomPropertyTypeKey(propertyDetail?.property_type, propertyDetail?.relation_type);

  if (allowedPropertyTypes && !allowedPropertyTypes.includes(propertyTypeKey)) {
    return null;
  }

  return ISSUE_PROPERTY_ATTRIBUTE_DETAILS[propertyTypeKey] || null;
});
