import React from "react";
import { observer } from "mobx-react";
// plane imports
import type { TDateFilterFieldConfig, TFilterConditionNodeForDisplay, TFilterProperty } from "@plane/types";
import { cn } from "@plane/utils";
import { TimeDropdown } from "@/components/dropdowns/time-picker";
import { COMMON_FILTER_ITEM_BORDER_CLASSNAME, EMPTY_FILTER_PLACEHOLDER_TEXT } from "../../shared";

type TSingleTimeFilterValueInputProps<P extends TFilterProperty> = {
  config: TDateFilterFieldConfig<string>;
  condition: TFilterConditionNodeForDisplay<P, string>;
  isDisabled?: boolean;
  onChange: (value: string | null | undefined) => void;
};

export const SingleTimeFilterValueInput = observer(
  <P extends TFilterProperty>(props: TSingleTimeFilterValueInputProps<P>) => {
    const { condition, isDisabled, onChange } = props;
    const conditionValue = typeof condition.value === "string" ? condition.value : null;

    return (
      <TimeDropdown
        value={conditionValue}
        onChange={(value) => onChange(value)}
        buttonClassName={cn("rounded-none", {
          [COMMON_FILTER_ITEM_BORDER_CLASSNAME]: !isDisabled,
          "text-custom-text-400": !conditionValue,
          "hover:bg-custom-background-100": isDisabled,
        })}
        hideIcon
        placeholder={EMPTY_FILTER_PLACEHOLDER_TEXT}
        buttonVariant="transparent-with-text"
        disabled={isDisabled}
      />
    );
  }
);
