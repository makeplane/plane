import React from "react";
import { observer } from "mobx-react";
import { ArrowRight } from "lucide-react";
// plane imports
import type { TDateRangeFilterFieldConfig, TFilterConditionNodeForDisplay, TFilterProperty } from "@plane/types";
import { cn, toFilterArray } from "@plane/utils";
import { TimeDropdown } from "@/components/dropdowns/time-picker";
// local imports
import { COMMON_FILTER_ITEM_BORDER_CLASSNAME, EMPTY_FILTER_PLACEHOLDER_TEXT } from "../../shared";

type TTimeRangeFilterValueInputProps<P extends TFilterProperty> = {
  config: TDateRangeFilterFieldConfig<string>;
  condition: TFilterConditionNodeForDisplay<P, string>;
  isDisabled?: boolean;
  onChange: (value: string[]) => void;
};

export const TimeRangeFilterValueInput = observer(
  <P extends TFilterProperty>(props: TTimeRangeFilterValueInputProps<P>) => {
    const { condition, isDisabled, onChange } = props;
    const [fromRaw, toRaw] = toFilterArray(condition.value) ?? [];
    const from = typeof fromRaw === "string" && fromRaw.trim() ? fromRaw : null;
    const to = typeof toRaw === "string" && toRaw.trim() ? toRaw : null;
    const isIncomplete = Boolean((from && !to) || (!from && to));

    const updateRange = (nextFrom: string | null, nextTo: string | null) => {
      const nextValues = [nextFrom, nextTo].filter((value): value is string => Boolean(value && value.trim()));
      onChange(nextValues);
    };

    return (
      <div
        className={cn("flex h-full items-center gap-1 px-1", {
          [COMMON_FILTER_ITEM_BORDER_CLASSNAME]: !isDisabled,
          "text-red-500": isIncomplete,
          "hover:bg-custom-background-100": isDisabled,
        })}
      >
        <TimeDropdown
          value={from}
          onChange={(value) => updateRange(value, to)}
          placeholder={EMPTY_FILTER_PLACEHOLDER_TEXT}
          buttonVariant="transparent-with-text"
          hideIcon
          buttonClassName={cn("rounded-none px-2 text-sm", {
            "text-custom-text-400": !from,
          })}
          isClearable={!isDisabled}
          disabled={isDisabled}
        />
        <ArrowRight className="h-3.5 w-3.5 text-custom-text-300" />
        <TimeDropdown
          value={to}
          onChange={(value) => updateRange(from, value)}
          placeholder={EMPTY_FILTER_PLACEHOLDER_TEXT}
          buttonVariant="transparent-with-text"
          hideIcon
          buttonClassName={cn("rounded-none px-2 text-sm", {
            "text-custom-text-400": !to,
          })}
          isClearable={!isDisabled}
          disabled={isDisabled}
        />
      </div>
    );
  }
);
