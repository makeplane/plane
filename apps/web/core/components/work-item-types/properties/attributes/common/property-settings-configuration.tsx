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

import { get, set } from "lodash-es";
import { observer } from "mobx-react";
// plane imports
import type { EIssuePropertyType, TIssuePropertySettingsMap, TSettingsConfigurations } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { RadioInput } from "@/components/estimates/radio-select";

type TPropertySettingsConfigurationProps<T extends EIssuePropertyType> = {
  settings: TIssuePropertySettingsMap[T] | undefined;
  settingsConfigurations: TSettingsConfigurations;
  isDisabled?: boolean;
  onChange: (value: TIssuePropertySettingsMap[T]) => void;
  getLabelDetails?: (labelKey: string) => string;
};

export const PropertyRadioInputSelect = observer(function PropertyRadioInputSelect<T extends EIssuePropertyType>(
  props: TPropertySettingsConfigurationProps<T>
) {
  const { settings, settingsConfigurations, isDisabled, onChange, getLabelDetails } = props;

  const radioInputOptions = settingsConfigurations.configurations.options.map((option) => ({
    label: getLabelDetails ? getLabelDetails(option.labelKey) : option.labelKey,
    value: option.value,
    disabled: isDisabled,
  }));

  const handleDataChange = (value: string) => {
    const updatedSettings = {
      ...settings,
    };
    set(updatedSettings, settingsConfigurations.keyToUpdate, value);
    onChange(updatedSettings as TIssuePropertySettingsMap[T]);
  };

  const selectedValue = get(settings, settingsConfigurations.keyToUpdate);
  const isVerticalLayout = settingsConfigurations.configurations.verticalLayout;

  return (
    <RadioInput
      selected={selectedValue}
      options={radioInputOptions}
      onChange={handleDataChange}
      className="z-10"
      buttonClassName="size-3!"
      fieldClassName={cn("text-caption-sm-regular!", {
        "gap-1!": !isVerticalLayout,
      })}
      wrapperClassName={cn(isVerticalLayout ? "gap-1.5!" : "gap-3!")}
      vertical={isVerticalLayout}
    />
  );
});

export const PropertySettingsConfiguration = observer(function PropertySettingsConfiguration<
  T extends EIssuePropertyType,
>(props: TPropertySettingsConfigurationProps<T>) {
  const { settings, settingsConfigurations, isDisabled, onChange, getLabelDetails } = props;

  switch (settingsConfigurations.configurations.componentToRender) {
    case "radio-input":
      return (
        <PropertyRadioInputSelect
          settings={settings}
          settingsConfigurations={settingsConfigurations}
          onChange={onChange}
          isDisabled={isDisabled}
          getLabelDetails={getLabelDetails}
        />
      );
    default:
      return null;
  }
});
