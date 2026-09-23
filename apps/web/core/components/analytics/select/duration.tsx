/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane package imports
import type { ReactNode } from "react";
import React from "react";
import { CalendarOutline } from "@makeplane/propel/icons";
// plane package imports
import { ANALYTICS_DURATION_FILTER_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Select } from "@plane/blocks/select";
// types
import type { TDropdownProps } from "@/components/dropdowns/types";

type TDurationOption = (typeof ANALYTICS_DURATION_FILTER_OPTIONS)[number];

type Props = TDropdownProps & {
  value: string | null;
  onChange: (val: TDurationOption["value"]) => void;
  //optional
  button?: ReactNode;
  dropdownArrow?: boolean;
  dropdownArrowClassName?: string;
  onClose?: () => void;
  renderByDefault?: boolean;
  tabIndex?: number;
};

const getDurationOption = (value: string | null) =>
  ANALYTICS_DURATION_FILTER_OPTIONS.find((option) => option.value === value) ?? null;

function DurationDropdown({ placeholder = "Duration", onChange, value }: Props) {
  useTranslation();

  // derived values
  const selectedOption = getDurationOption(value);

  return (
    <Select<TDurationOption>
      getValues={() => [...ANALYTICS_DURATION_FILTER_OPTIONS]}
      value={selectedOption}
      onChange={(val) => {
        const option = getDurationOption(val);
        if (option) onChange(option.value);
      }}
      getOptionValue={(option) => option.value}
      getOptionLabel={(option) => option.name}
      pinSelected={false}
    >
      <Select.Trigger<TDurationOption> variant="select-md" prependIcon={<CalendarOutline aria-hidden="true" />}>
        {(selected) => <span className="truncate">{selected[0]?.name ?? placeholder}</span>}
      </Select.Trigger>
    </Select>
  );
}

export default DurationDropdown;
