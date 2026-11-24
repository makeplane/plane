/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
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
    <div className="flex h-full w-full items-center overflow-hidden">
      <div className="flex min-w-0 items-center overflow-hidden">
        {selectedOptions.slice(0, displayCount).map((option, index) => (
          <React.Fragment key={String(option.value)}>
            <div className="flex min-w-0 items-center whitespace-nowrap">
              {option?.icon && <span className={cn("mr-1 shrink-0", option.iconClassName)}>{option.icon}</span>}
              <span className="max-w-24 truncate">{option?.label}</span>
            </div>
            {index < Math.min(displayCount, selectedOptions.length) - 1 && (
              <span className="mx-1 shrink-0 text-tertiary">,</span>
            )}
          </React.Fragment>
        ))}
      </div>
      {remainingCount > 0 && (
        // Was a Headless UI `Transition show appear` doing nothing but a fade-in on mount (Ruling 36).
        <span className="ml-1 shrink-0 animate-fade-in whitespace-nowrap text-tertiary motion-reduce:animate-none">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}
