// components
import { observer } from "mobx-react";
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EAutomationChangeType } from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";
import { cn } from "@plane/utils";
// helpers
import { getNestedError } from "@/helpers/react-hook-form.helper";
// local imports
import { TAutomationActionFormData } from "../../root";
import { getPropertyChangeDropdownClassNames } from "./common";

type TProps = {
  isDisabled?: boolean;
  supportedChangeTypes: EAutomationChangeType[];
  onChangeTypeChange: (changeType: EAutomationChangeType) => void;
};

export const ChangeTypeSelect: React.FC<TProps> = observer((props) => {
  const { isDisabled, supportedChangeTypes, onChangeTypeChange } = props;
  // plane hooks
  const { t } = useTranslation();
  // form hooks
  const {
    control,
    formState: { errors },
  } = useFormContext<TAutomationActionFormData>();
  // derived values
  const changeTypeError = getNestedError(errors, "config.change_type");
  const { dropdownButtonClassName, errorClassName } = getPropertyChangeDropdownClassNames(!!isDisabled);
  const changeTypeOptions = supportedChangeTypes.map((change_type) => ({
    value: change_type,
    query: change_type,
    content: change_type,
  }));

  return (
    <div className="space-y-1">
      <Controller
        control={control}
        name="config.change_type"
        rules={{
          required: t("automations.action.configuration.change_property.validation.change_type_required"),
        }}
        render={({ field: { onChange, value } }) => (
          <CustomSearchSelect
            buttonClassName={cn(dropdownButtonClassName, {
              [errorClassName]: Boolean(changeTypeError),
            })}
            options={changeTypeOptions}
            value={value || ""}
            onChange={(change_type: EAutomationChangeType) => {
              onChange(change_type);
              onChangeTypeChange(change_type);
            }}
            label={value || t("automations.action.configuration.change_property.placeholders.change_type")}
            disabled={isDisabled}
          />
        )}
      />
      {changeTypeError && typeof changeTypeError.message === "string" && (
        <span className="text-xs font-medium text-red-500">{changeTypeError.message}</span>
      )}
    </div>
  );
});
