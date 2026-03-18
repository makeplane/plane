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
import type { CustomProperty, TOperationMode } from "@plane/types";
// context
import { useCustomPropertyOptions } from "../context";
// local imports
import type { TCustomPropertyFormError } from "../types";
import { PropertyMultiSelect } from "./common/property-multi-select";
import { PropertySettingsConfiguration } from "./common/property-settings-configuration";
import { IssuePropertyOptionsRoot } from "./options";
import { DefaultOptionSelect } from "./options/default-option-select";

type TDropdownAttributesProps = {
  dropdownPropertyDetail: Partial<CustomProperty<"OPTION">>;
  currentOperationMode: TOperationMode;
  onDropdownDetailChange: <K extends keyof CustomProperty<"OPTION">>(
    key: K,
    value: CustomProperty<"OPTION">[K],
    shouldSync?: boolean
  ) => void;
  error?: TCustomPropertyFormError;
  isUpdateAllowed: boolean;
};

export const DropdownAttributes = observer(function DropdownAttributes(props: TDropdownAttributesProps) {
  const { dropdownPropertyDetail, currentOperationMode, onDropdownDetailChange, error, isUpdateAllowed } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { propertyOptions, setPropertyOptions } = useCustomPropertyOptions();
  // derived values
  const isOptionDefaultDisabled = dropdownPropertyDetail.is_multi === undefined || !!dropdownPropertyDetail.is_required;
  // helpers
  const resetToSingleSelectDefault = () => {
    const firstDefaultOption = propertyOptions?.find((option) => option.is_default);
    const firstDefaultOptionIdentifier = firstDefaultOption?.id ?? firstDefaultOption?.key;
    // Update property options
    setPropertyOptions((prevOptions) => {
      if (!prevOptions) return [];
      return prevOptions.map((option) => ({
        ...option,
        is_default:
          !!firstDefaultOptionIdentifier &&
          (option.id === firstDefaultOptionIdentifier || option.key === firstDefaultOptionIdentifier),
      }));
    });
    // Update default value
    const newDefaultValue = firstDefaultOptionIdentifier ? [firstDefaultOptionIdentifier] : [];
    onDropdownDetailChange("default_value", newDefaultValue);
  };

  return (
    <>
      <div>
        <span className="text-caption-md-regular text-tertiary">
          {t("work_item_types.settings.properties.attributes.label")}
        </span>
        <PropertyMultiSelect
          value={dropdownPropertyDetail.is_multi}
          variant="OPTION"
          onChange={(value) => {
            onDropdownDetailChange("is_multi", value);
            if (!value) {
              resetToSingleSelectDefault();
            }
          }}
          isDisabled={currentOperationMode === "update" && !isUpdateAllowed}
        />
      </div>
      {ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS?.OPTION?.length && (
        <div>
          {ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS?.OPTION?.map((configurations, index) => (
            <PropertySettingsConfiguration
              key={index}
              settings={dropdownPropertyDetail.settings ?? undefined}
              settingsConfigurations={configurations}
              onChange={(value) => onDropdownDetailChange("settings", value as CustomProperty<"OPTION">["settings"])}
              isDisabled={!configurations.allowedEditingModes.includes(currentOperationMode) && !isUpdateAllowed}
            />
          ))}
        </div>
      )}
      <IssuePropertyOptionsRoot customPropertyId={dropdownPropertyDetail.id} error={error?.options} />
      <div>
        <div className="text-caption-md-medium text-tertiary">
          {t("common.default")} <span className="font-normal italic">({t("common.optional")})</span>
        </div>
        <DefaultOptionSelect isMultiSelect={dropdownPropertyDetail.is_multi} isDisabled={isOptionDefaultDisabled} />
      </div>
    </>
  );
});
