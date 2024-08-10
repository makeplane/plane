// plane web components
import { RadioInput } from "@/components/estimates";
// plane web constants
import { DROPDOWN_ATTRIBUTES } from "@/plane-web/constants/issue-properties";
// plane web types
import { TIssuePropertyTypeKeys } from "@/plane-web/types";

type TPropertyMultiSelectProps = {
  value: boolean | undefined;
  variant?: TIssuePropertyTypeKeys;
  isDisabled?: boolean;
  onChange: (value: boolean) => void;
};

export const PropertyMultiSelect = (props: TPropertyMultiSelectProps) => {
  const { value, variant = "RELATION_ISSUE", isDisabled = false, onChange } = props;
  // derived values
  const MULTI_SELECT_ATTRIBUTES = DROPDOWN_ATTRIBUTES[variant] ?? [];

  const memberPickerAttributeOptions = MULTI_SELECT_ATTRIBUTES.map((attribute) => ({
    label: attribute.label,
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
      fieldClassName="text-sm"
      wrapperClassName="gap-1"
      vertical
    />
  );
};
