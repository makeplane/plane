import React from "react";
import { Transition } from "@headlessui/react";
// plane imports
import type { SingleOrArray, IFilterOption, TFilterValue } from "@plane/types";
import { cn, toFilterArray } from "@plane/utils";
import { EMPTY_FILTER_PLACEHOLDER_TEXT } from "../../shared";

type TSelectedOptionsDisplayProps<V extends TFilterValue> = {
  selectedValue: SingleOrArray<V>;
  options: IFilterOption<V>[];
  displayCount?: number;
  emptyValue?: string;
  fallbackText?: string;
};

export function SelectedOptionsDisplay<V extends TFilterValue>(props: TSelectedOptionsDisplayProps<V>) {
  const { selectedValue, options, displayCount = 2, emptyValue = EMPTY_FILTER_PLACEHOLDER_TEXT, fallbackText } = props;
  // derived values
  const selectedArray = toFilterArray(selectedValue);
  const remainingCount = selectedArray.length - displayCount;
  const selectedOptions = selectedArray
    .map((value) => options.find((opt) => opt.value === value))
    .filter(Boolean) as IFilterOption<V>[];

  // When no value is selected, display the empty value
  if (selectedArray.length === 0) {
    return <span className="text-placeholder">{emptyValue}</span>;
  }

  // When no options are found but we have a fallback text
  if (options.length === 0) {
    return <span className="text-placeholder">{fallbackText ?? `${selectedArray.length} option(s) selected`}</span>;
  }

  return (
    <div className="flex items-center h-full overflow-hidden">
      {selectedOptions.slice(0, displayCount).map((option, index) => (
        <React.Fragment key={index}>
          <div className="flex items-center whitespace-nowrap">
            {option?.icon && <span className={cn("mr-1", option.iconClassName)}>{option.icon}</span>}
            <span className="truncate max-w-24">{option?.label}</span>
          </div>
          {index < Math.min(displayCount, selectedOptions.length) - 1 && <span className="text-tertiary mx-1">,</span>}
        </React.Fragment>
      ))}
      {remainingCount > 0 && (
        <Transition
          show
          appear
          enter="transition-opacity duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          className="text-tertiary whitespace-nowrap ml-1"
        >
          +{remainingCount} more
        </Transition>
      )}
    </div>
  );
}
