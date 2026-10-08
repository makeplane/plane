/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { DateRangeSelect } from "@plane/blocks/property-select";
import type { DateRangeValue } from "@plane/blocks/property-select";
import type { TDateRangeFilterFieldConfig, TFilterConditionNodeForDisplay, TFilterProperty } from "@plane/types";
import { cn, isValidDate, renderFormattedPayloadDate, toFilterArray } from "@plane/utils";
// hooks
import { useUserProfile } from "@/hooks/store/user";
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
  // store hooks
  const { data: userProfile } = useUserProfile();
  // derived values
  const [fromRaw, toRaw] = toFilterArray(condition.value) ?? [];
  const from = isValidDate(fromRaw) ? new Date(fromRaw) : null;
  const to = isValidDate(toRaw) ? new Date(toRaw) : null;
  const isIncomplete = !from || !to;

  // Handler for date range selection
  const handleSelect = (range: DateRangeValue) => {
    const formattedFrom = range.from ? renderFormattedPayloadDate(range.from) : undefined;
    const formattedTo = range.to ? renderFormattedPayloadDate(range.to) : undefined;
    if (formattedFrom && formattedTo) {
      onChange([formattedFrom, formattedTo]);
    } else {
      onChange([]);
    }
  };

  return (
    <DateRangeSelect
      value={{ from, to }}
      onChange={handleSelect}
      minDate={config.min}
      maxDate={config.max}
      mergeDates
      // The legacy `renderPlaceholder` boolean plus `placeholder.from` is one string here: the old
      // dropdown drew no arrow without a `placeholder.to`, so the whole empty state is "--".
      placeholder={EMPTY_FILTER_PLACEHOLDER_TEXT}
      weekStartsOn={userProfile?.start_of_the_week}
      // A flat segment of the filter chip, like the property and operator segments beside it.
      className={cn("h-full max-w-none rounded-none border-0 bg-transparent text-body-xs-regular", {
        [COMMON_FILTER_ITEM_BORDER_CLASSNAME]: !isDisabled,
        "text-danger-primary": isIncomplete,
      })}
      variant="pill-lg"
      defaultOpen={isIncomplete}
      disabled={isDisabled}
    />
  );
});
