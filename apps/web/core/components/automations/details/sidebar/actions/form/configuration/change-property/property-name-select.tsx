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

// components
import { observer } from "mobx-react";
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EAutomationChangePropertyType } from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";
import { cn, getAutomationChangePropertyTypeLabel } from "@plane/utils";
// helpers
import { getNestedError } from "@/helpers/react-hook-form.helper";
// local imports
import type { TAutomationActionFormData } from "../../root";
import { getPropertyChangeDropdownClassNames } from "./common";

type TProps = {
  isDisabled?: boolean;
  onPropertyChange: (property: EAutomationChangePropertyType) => void;
};

export const PropertyNameSelect = observer(function PropertyNameSelect(props: TProps) {
  const { isDisabled, onPropertyChange } = props;
  // plane hooks
  const { t } = useTranslation();
  // form hooks
  const {
    control,
    formState: { errors },
  } = useFormContext<TAutomationActionFormData>();
  // derived values
  const propertyError = getNestedError(errors, "config.property_name");
  const { dropdownButtonClassName, errorClassName } = getPropertyChangeDropdownClassNames(!!isDisabled);

  const propertyOptions = Object.values(EAutomationChangePropertyType).map((key) => {
    const label = getAutomationChangePropertyTypeLabel(key);
    return {
      value: key,
      query: label,
      content: label,
    };
  });

  return (
    <div className="space-y-1">
      <Controller
        control={control}
        name="config.property_name"
        rules={{
          required: t("automations.action.configuration.change_property.validation.property_name_required"),
        }}
        render={({ field: { onChange, value } }) => (
          <CustomSearchSelect
            buttonClassName={cn(dropdownButtonClassName, {
              [errorClassName]: Boolean(propertyError),
            })}
            options={propertyOptions}
            value={value || ""}
            onChange={(property_name: EAutomationChangePropertyType) => {
              onChange(property_name);
              onPropertyChange(property_name);
            }}
            label={
              value
                ? getAutomationChangePropertyTypeLabel(value)
                : t("automations.action.configuration.change_property.placeholders.property_name")
            }
            disabled={isDisabled}
          />
        )}
      />
      {propertyError && typeof propertyError.message === "string" && (
        <span className="text-11 font-medium text-danger-primary">{propertyError.message}</span>
      )}
    </div>
  );
});
