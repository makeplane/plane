import { observer } from "mobx-react";
// plane imports
import { DROPDOWN_ATTRIBUTES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TIssuePropertyTypeKeys } from "@plane/types";
// components
import { RadioInput } from "@/components/estimates/radio-select";

type TPropertyMultiSelectProps = {
  value: boolean | undefined;
  variant?: TIssuePropertyTypeKeys;
  isDisabled?: boolean;
  onChange: (value: boolean) => void;
};

export const PropertyMultiSelect = observer((props: TPropertyMultiSelectProps) => {
  const { value, variant = "RELATION_ISSUE", isDisabled = false, onChange } = props;
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const MULTI_SELECT_ATTRIBUTES = DROPDOWN_ATTRIBUTES[variant] ?? [];

  const memberPickerAttributeOptions = MULTI_SELECT_ATTRIBUTES.map((attribute) => ({
    label: t(attribute.i18n_label),
    value: attribute.key,
    disabled: isDisabled,
  }));

  const getSelectedValue = () => {
    if (value === undefined) {
      return undefined;
    }
    return value ? "multi_select" : "single_select";
  };

  return (
    <RadioInput
      selected={getSelectedValue() ?? ""}
      options={memberPickerAttributeOptions}
      onChange={(value) => onChange(value === "multi_select")}
      className="z-10"
      buttonClassName="size-3"
      fieldClassName="text-sm gap-1"
      wrapperClassName="gap-3"
    />
  );
});
