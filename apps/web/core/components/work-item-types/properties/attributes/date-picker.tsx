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
import { ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS } from "@plane/constants";
import type { EIssuePropertyType, TDateAttributeDisplayOptions, TIssueProperty, TOperationMode } from "@plane/types";
import { getDateAttributeDisplayName } from "@plane/utils";
// local imports
import { PropertySettingsConfiguration } from "./common/property-settings-configuration";

type TDatePickerAttributesProps = {
  datePickerPropertyDetail: Partial<TIssueProperty<EIssuePropertyType.DATETIME>>;
  currentOperationMode: TOperationMode;
  onDatePickerDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType.DATETIME>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType.DATETIME>[K],
    shouldSync?: boolean
  ) => void;
  isUpdateAllowed: boolean;
};

export const DatePickerAttributes = observer(function DatePickerAttributes(props: TDatePickerAttributesProps) {
  const { datePickerPropertyDetail, currentOperationMode, onDatePickerDetailChange, isUpdateAllowed } = props;

  return (
    <>
      {ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS?.DATETIME?.map((configurations, index) => (
        <PropertySettingsConfiguration
          key={index}
          settings={datePickerPropertyDetail.settings}
          settingsConfigurations={configurations}
          onChange={(value) =>
            onDatePickerDetailChange("settings", value as TIssueProperty<EIssuePropertyType.DATETIME>["settings"])
          }
          getLabelDetails={(labelKey) => getDateAttributeDisplayName(labelKey as TDateAttributeDisplayOptions)}
          isDisabled={!configurations.allowedEditingModes.includes(currentOperationMode) && !isUpdateAllowed}
        />
      ))}
    </>
  );
});
