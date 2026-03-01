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
import type { TIssueProperty, TOperationMode } from "@plane/types";
import { EIssuePropertyType } from "@plane/types";
// local imports
import type { TIssuePropertyFormError } from "../property-list-item";
import { SelectedAttributeProperties } from "./selected-attribute-properties";

type TPropertyAttributesProps = {
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType>>;
  currentOperationMode: TOperationMode | null;
  onPropertyDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType>[K],
    shouldSync?: boolean
  ) => void;
  error?: TIssuePropertyFormError;
  isUpdateAllowed: boolean;
};

export const PropertyAttributes = observer(function PropertyAttributes(props: TPropertyAttributesProps) {
  const { propertyDetail, currentOperationMode, onPropertyDetailChange, error, isUpdateAllowed } = props;
  // list of property types that should not be allowed to change attributes
  const DISABLE_ATTRIBUTE_CHANGE_LIST = [EIssuePropertyType.BOOLEAN, EIssuePropertyType.DATETIME];

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
        error={error}
        isUpdateAllowed={isUpdateAllowed}
      />
    </div>
  );
});
