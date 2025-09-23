import React from "react";
import { observer } from "mobx-react";
// plane imports
import { TDateFilterFieldConfig, TFilterConditionNodeForDisplay, TFilterProperty } from "@plane/types";
import { cn, renderFormattedPayloadDate } from "@plane/utils";
import { DateDropdown } from "@/components/dropdowns/date";
import { COMMON_FILTER_ITEM_BORDER_CLASSNAME } from "../../shared";

type TSingleDateFilterValueInputProps<P extends TFilterProperty> = {
  config: TDateFilterFieldConfig<string>;
  condition: TFilterConditionNodeForDisplay<P, string>;
  isDisabled?: boolean;
  onChange: (value: string | null | undefined) => void;
};

export const SingleDateFilterValueInput = observer(
  <P extends TFilterProperty>(props: TSingleDateFilterValueInputProps<P>) => {
    const { config, condition, isDisabled, onChange } = props;
    // derived values
    const conditionValue = typeof condition.value === "string" ? condition.value : null;

    return (
      <DateDropdown
        value={conditionValue}
        onChange={(value: Date | null) => {
          const formattedDate = value ? renderFormattedPayloadDate(value) : null;
          onChange(formattedDate);
        }}
        buttonClassName={cn("rounded-none", {
          [COMMON_FILTER_ITEM_BORDER_CLASSNAME]: !isDisabled,
          "text-custom-text-400": !conditionValue,
          "hover:bg-custom-background-100": isDisabled,
        })}
        minDate={config.min}
        maxDate={config.max}
        icon={null}
        placeholder="--"
        buttonVariant="transparent-with-text"
        isClearable={false}
        closeOnSelect
        defaultOpen={!conditionValue}
        disabled={isDisabled}
      />
    );
  }
);
