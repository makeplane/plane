/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { DateSelect } from "@plane/blocks/property-select";
import type { TDateFilterFieldConfig, TFilterConditionNodeForDisplay, TFilterProperty } from "@plane/types";
import { cn, getDate, renderFormattedPayloadDate } from "@plane/utils";
// hooks
import { useUserProfile } from "@/hooks/store/user";
// local imports
import { EMPTY_FILTER_PLACEHOLDER_TEXT } from "../../shared";

type TSingleDateFilterValueInputProps<P extends TFilterProperty> = {
  config: TDateFilterFieldConfig<string>;
  condition: TFilterConditionNodeForDisplay<P, string>;
  isDisabled?: boolean;
  onChange: (value: string | null | undefined) => void;
};

export const SingleDateFilterValueInput = observer(function SingleDateFilterValueInput<P extends TFilterProperty>(
  props: TSingleDateFilterValueInputProps<P>
) {
  const { config, condition, isDisabled, onChange } = props;
  // store hooks
  const { data: userProfile } = useUserProfile();
  // derived values
  const conditionValue = typeof condition.value === "string" ? condition.value : null;

  return (
    <DateSelect
      value={getDate(conditionValue) ?? null}
      onChange={(value) => {
        const formattedDate = value ? renderFormattedPayloadDate(value) : null;
        onChange(formattedDate);
      }}
      // A pill segment of the condition, like the property and operator segments beside it.
      className={cn("max-w-none text-body-xs-regular", { "text-placeholder": !conditionValue })}
      minDate={config.min}
      maxDate={config.max}
      placeholder={EMPTY_FILTER_PLACEHOLDER_TEXT}
      weekStartsOn={userProfile?.start_of_the_week}
      defaultOpen={!conditionValue}
      disabled={isDisabled}
      variant="pill-lg"
    />
  );
});
