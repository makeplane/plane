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
import type { EAutomationChangeType, EAutomationChangePropertyType } from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";
import { cn, renderFormattedPayloadDate } from "@plane/utils";
// components
import { DateDropdown } from "@/components/dropdowns/date";
// helpers
import { getNestedError } from "@/helpers/react-hook-form.helper";
import type { TChangePropertyConfiguration } from "@/plane-web/hooks/automations/use-automation-action-config";
import { EConfigurationComponentType } from "@/plane-web/hooks/automations/use-automation-action-config";
// local imports
import type { TAutomationActionFormData } from "../../root";
import { getPropertyChangeDropdownClassNames } from "./common";

type TProps = {
  isDisabled?: boolean;
  propertyName?: EAutomationChangePropertyType;
  changeType?: EAutomationChangeType;
  configuration?: TChangePropertyConfiguration;
};

export const PropertyValueSelect = observer(function PropertyValueSelect(props: TProps) {
  const { isDisabled, propertyName, changeType, configuration } = props;
  // plane hooks
  const { t } = useTranslation();
  // form hooks
  const {
    control,
    formState: { errors },
  } = useFormContext<TAutomationActionFormData>();
  // derived values
  const propertyValueError = getNestedError(errors, "config.property_value");
  const { dropdownButtonClassName, errorClassName } = getPropertyChangeDropdownClassNames(!!isDisabled);

  if (!propertyName || !changeType || !configuration) {
    return null;
  }

  return (
    <div className="space-y-1">
      <Controller
        control={control}
        name="config.property_value"
        rules={{
          required: t("automations.action.configuration.change_property.validation.property_value_required"),
          validate: (value) => {
            if (!value || value.length === 0) {
              return t("automations.action.configuration.change_property.validation.property_value_required");
            }
            return true;
          },
        }}
        render={({ field: { onChange, value } }) => (
          <>
            {configuration.component_type === EConfigurationComponentType.SINGLE_SELECT && (
              <CustomSearchSelect
                buttonClassName={cn(dropdownButtonClassName, {
                  [errorClassName]: Boolean(propertyValueError),
                })}
                options={configuration.options}
                value={value?.[0] || ""}
                onChange={(property_value: string) => onChange([property_value])}
                label={
                  value && value.length > 0
                    ? configuration.getPreviewContent(value)
                    : t("automations.action.configuration.change_property.placeholders.property_value_select", {
                        count: 1,
                      })
                }
                disabled={isDisabled}
                multiple={false}
              />
            )}
            {configuration.component_type === EConfigurationComponentType.MULTI_SELECT && (
              <CustomSearchSelect
                buttonClassName={cn(dropdownButtonClassName, {
                  [errorClassName]: Boolean(propertyValueError),
                })}
                options={configuration.options}
                value={value || []}
                onChange={(property_value: string[]) => onChange(property_value)}
                label={
                  value && value.length > 0
                    ? configuration.getPreviewContent(value)
                    : t("automations.action.configuration.change_property.placeholders.property_value_select", {
                        count: 2,
                      })
                }
                disabled={isDisabled}
                multiple
              />
            )}
            {configuration.component_type === EConfigurationComponentType.DATE_PICKER && (
              <DateDropdown
                value={value?.[0] ? new Date(value[0]) : null}
                onChange={(updatedValue) => {
                  const formattedDate = updatedValue ? renderFormattedPayloadDate(updatedValue) : null;
                  onChange(formattedDate ? [formattedDate] : []);
                }}
                buttonContainerClassName="w-full text-left"
                buttonClassName={cn(dropdownButtonClassName, {
                  [errorClassName]: Boolean(propertyValueError),
                })}
                minDate={configuration.minDate}
                maxDate={configuration.maxDate}
                placeholder={
                  value?.[0]
                    ? new Date(value[0]).toLocaleDateString()
                    : t("automations.action.configuration.change_property.placeholders.property_value_select_date")
                }
                buttonVariant="border-with-text"
                disabled={isDisabled}
              />
            )}
          </>
        )}
      />
      {propertyValueError && typeof propertyValueError.message === "string" && (
        <span className="text-11 font-medium text-danger-primary">{propertyValueError.message}</span>
      )}
    </div>
  );
});
