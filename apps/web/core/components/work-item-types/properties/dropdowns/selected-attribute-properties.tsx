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
import type { EIssuePropertyType, TIssueProperty, TIssuePropertyTypeKeys, TOperationMode } from "@plane/types";
import { getIssuePropertyTypeKey } from "@plane/utils";
// local imports
import { BooleanAttributes } from "../attributes/boolean";
import { DatePickerAttributes } from "../attributes/date-picker";
import { DropdownAttributes } from "../attributes/dropdown";
import { MemberPickerAttributes } from "../attributes/member-picker";
import { NumberAttributes } from "../attributes/number";
import { TextAttributes } from "../attributes/text";
import type { TIssuePropertyFormError } from "../property-list-item";

type TSelectedPropertyAttributesProps = {
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType>>;
  currentOperationMode: TOperationMode;
  onPropertyDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType>[K],
    shouldSync?: boolean
  ) => void;
  disabled?: boolean;
  error?: TIssuePropertyFormError;
  isUpdateAllowed: boolean;
};

export const SelectedAttributeProperties = observer(function SelectedAttributeProperties(
  props: TSelectedPropertyAttributesProps
) {
  const { propertyDetail, currentOperationMode, onPropertyDetailChange, error, isUpdateAllowed } = props;

  const ISSUE_PROPERTY_ATTRIBUTE_DETAILS: Partial<Record<TIssuePropertyTypeKeys, React.ReactNode>> = {
    TEXT: (
      <TextAttributes
        textPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.TEXT>>}
        currentOperationMode={currentOperationMode}
        onTextDetailChange={onPropertyDetailChange}
        isUpdateAllowed={isUpdateAllowed}
      />
    ),
    DECIMAL: (
      <NumberAttributes
        numberPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.DECIMAL>>}
        currentOperationMode={currentOperationMode}
        onNumberDetailChange={onPropertyDetailChange}
        isUpdateAllowed={isUpdateAllowed}
      />
    ),
    OPTION: (
      <DropdownAttributes
        dropdownPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.OPTION>>}
        currentOperationMode={currentOperationMode}
        onDropdownDetailChange={onPropertyDetailChange}
        error={error}
        isUpdateAllowed={isUpdateAllowed}
      />
    ),
    BOOLEAN: (
      <BooleanAttributes
        booleanPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.BOOLEAN>>}
        currentOperationMode={currentOperationMode}
        onBooleanDetailChange={onPropertyDetailChange}
        isUpdateAllowed={isUpdateAllowed}
      />
    ),
    DATETIME: (
      <DatePickerAttributes
        datePickerPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.DATETIME>>}
        currentOperationMode={currentOperationMode}
        onDatePickerDetailChange={onPropertyDetailChange}
        isUpdateAllowed={isUpdateAllowed}
      />
    ),
    RELATION_USER: (
      <MemberPickerAttributes
        memberPickerPropertyDetail={propertyDetail as Partial<TIssueProperty<EIssuePropertyType.RELATION>>}
        currentOperationMode={currentOperationMode}
        onMemberPickerDetailChange={onPropertyDetailChange}
        isUpdateAllowed={isUpdateAllowed}
      />
    ),
  };

  const propertyTypeKey = getIssuePropertyTypeKey(propertyDetail?.property_type, propertyDetail?.relation_type);
  return ISSUE_PROPERTY_ATTRIBUTE_DETAILS[propertyTypeKey] || null;
});
