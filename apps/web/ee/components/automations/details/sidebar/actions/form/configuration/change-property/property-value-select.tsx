// components
import { observer } from "mobx-react";
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EAutomationChangeType, EAutomationChangePropertyType, ICustomSearchSelectOption } from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";
import { cn, renderFormattedPayloadDate } from "@plane/utils";
// components
import { DateDropdown } from "@/components/dropdowns/date";
// helpers
import { getNestedError } from "@/helpers/react-hook-form.helper";
// local imports
import { TAutomationActionFormData } from "../../root";
import { getPropertyChangeDropdownClassNames } from "./common";

enum EConfigurationComponentType {
  SINGLE_SELECT = "single_select",
  MULTI_SELECT = "multi_select",
  DATE_PICKER = "date_picker",
}

type TSingleSelectConfiguration = {
  component_type: EConfigurationComponentType.SINGLE_SELECT;
  options: ICustomSearchSelectOption[];
};

type TMultiSelectConfiguration = {
  component_type: EConfigurationComponentType.MULTI_SELECT;
  options: ICustomSearchSelectOption[];
};

type TDatePickerConfiguration = {
  component_type: EConfigurationComponentType.DATE_PICKER;
  minDate?: Date;
  maxDate?: Date;
};

type TComponentConfiguration = TSingleSelectConfiguration | TMultiSelectConfiguration | TDatePickerConfiguration;

type TProps = {
  isDisabled?: boolean;
  propertyName?: EAutomationChangePropertyType;
  changeType?: EAutomationChangeType;
  configuration?: TComponentConfiguration;
};

export const PropertyValueSelect: React.FC<TProps> = observer((props) => {
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
                  value?.[0]
                    ? configuration.options.find((opt) => opt.value === value[0])?.query ||
                      t("automations.action.configuration.change_property.placeholders.property_value_select", {
                        count: 1,
                      })
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
                label={t("automations.action.configuration.change_property.placeholders.property_value_select", {
                  count: 2,
                })}
                disabled={isDisabled}
                multiple
              />
            )}
            {configuration.component_type === EConfigurationComponentType.DATE_PICKER && (
              <DateDropdown
                value={value?.[0] ? new Date(value[0]) : null}
                onChange={(property_value: Date | null) => {
                  const formattedDate = property_value ? renderFormattedPayloadDate(property_value) : null;
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
        <span className="text-xs font-medium text-red-500">{propertyValueError.message}</span>
      )}
    </div>
  );
});
