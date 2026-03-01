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
import { useTranslation } from "@plane/i18n";
import type { EIssuePropertyType, TIssueProperty, TOperationMode } from "@plane/types";
// local imports
import { NumberValueInput } from "../../values/components/number-input";
import { PropertySettingsConfiguration } from "./common/property-settings-configuration";

type TNumberAttributesProps = {
  numberPropertyDetail: Partial<TIssueProperty<EIssuePropertyType.DECIMAL>>;
  currentOperationMode: TOperationMode;
  onNumberDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType.DECIMAL>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType.DECIMAL>[K],
    shouldSync?: boolean
  ) => void;
  isUpdateAllowed: boolean;
};

export const NumberAttributes = observer(function NumberAttributes(props: TNumberAttributesProps) {
  const { numberPropertyDetail, currentOperationMode, onNumberDetailChange, isUpdateAllowed } = props;
  // plane hooks
  const { t } = useTranslation();

  return (
    <div>
      {ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS?.DECIMAL?.length && (
        <div className="pb-2">
          {ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS?.DECIMAL?.map((configurations, index) => (
            <PropertySettingsConfiguration
              key={index}
              settings={numberPropertyDetail.settings}
              settingsConfigurations={configurations}
              onChange={(value) =>
                onNumberDetailChange("settings", value as TIssueProperty<EIssuePropertyType.DECIMAL>["settings"])
              }
              isDisabled={!configurations.allowedEditingModes.includes(currentOperationMode) && !isUpdateAllowed}
            />
          ))}
        </div>
      )}
      <div className="text-caption-sm-medium  text-tertiary">
        {t("common.default")} <span className="font-normal italic">({t("common.optional")})</span>
      </div>
      <NumberValueInput
        propertyDetail={numberPropertyDetail}
        value={numberPropertyDetail.default_value ?? []}
        onNumberValueChange={async (value) => onNumberDetailChange("default_value", value)}
        variant="create"
        className="w-full text-body-xs-regular bg-surface-1 border-[0.5px] rounded"
        numberInputSize="xs"
        isDisabled={!!numberPropertyDetail.is_required}
      />
    </div>
  );
});
