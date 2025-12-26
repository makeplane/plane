import React from "react";
import { observer } from "mobx-react";
// plane imports
import type { TDateRangeFilterFieldConfig, TFilterConditionNodeForDisplay, TFilterProperty } from "@plane/types";
import { cn, isValidDate, renderFormattedPayloadDate, toFilterArray } from "@plane/utils";
// components
import { DateRangeDropdown } from "@/components/dropdowns/date-range";
// local imports
import { COMMON_FILTER_ITEM_BORDER_CLASSNAME, EMPTY_FILTER_PLACEHOLDER_TEXT } from "../../shared";

type TDateRangeFilterValueInputProps<P extends TFilterProperty> = {
  config: TDateRangeFilterFieldConfig<string>;
  condition: TFilterConditionNodeForDisplay<P, string>;
  isDisabled?: boolean;
  onChange: (value: string[]) => void;
};

export const DateRangeFilterValueInput = observer(function DateRangeFilterValueInput<P extends TFilterProperty>(
  props: TDateRangeFilterValueInputProps<P>
) {
  const { config, condition, isDisabled, onChange } = props;
  // derived values
  const [fromRaw, toRaw] = toFilterArray(condition.value) ?? [];
  const from = isValidDate(fromRaw) ? new Date(fromRaw) : undefined;
  const to = isValidDate(toRaw) ? new Date(toRaw) : undefined;
  const isIncomplete = !from || !to;

  // Handler for date range selection
  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    const formattedFrom = range?.from ? renderFormattedPayloadDate(range.from) : undefined;
    const formattedTo = range?.to ? renderFormattedPayloadDate(range.to) : undefined;
    if (formattedFrom && formattedTo) {
      onChange([formattedFrom, formattedTo]);
    } else {
      onChange([]);
    }
  };

  return (
    <DateRangeDropdown
      value={{ from, to }}
      onSelect={handleSelect}
      minDate={config.min}
      maxDate={config.max}
      mergeDates
      placeholder={{ from: EMPTY_FILTER_PLACEHOLDER_TEXT }}
      buttonVariant="transparent-with-text"
      buttonClassName={cn("rounded-none", {
        [COMMON_FILTER_ITEM_BORDER_CLASSNAME]: !isDisabled,
        "text-danger-primary": isIncomplete,
        "hover:bg-surface-1": isDisabled,
      })}
      renderPlaceholder
      renderInPortal
      defaultOpen={isIncomplete}
      disabled={isDisabled}
    />
  );
});
