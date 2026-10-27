/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { observer } from "mobx-react";
// plane imports
import { useFilter } from "@makeplane/propel/components/combobox";
import { ComboboxField } from "@makeplane/propel/components/combobox-field";
import type { ComboboxTriggerWidth, FieldSize } from "@makeplane/propel/components/combobox-field";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// hooks
import useTimezone from "@/hooks/use-timezone";

/** The searchable option shape `useTimezone` emits, plus the plain-text label Propel rows need. */
type TTimezoneOption = {
  value: string;
  label: string;
  query: string;
};

const getTimezoneValue = (option: TTimezoneOption) => option.value;
const getOptionLabel = (option: TTimezoneOption) => option.label;

type TTimezoneSelect = {
  value: string | undefined;
  onChange: (value: string) => void;
  error?: boolean;
  errorMessage?: string;
  fieldLabel?: string;
  label?: string;
  size?: FieldSize;
  width?: ComboboxTriggerWidth;
  className?: string;
  /** @deprecated No effect: the Propel trigger owns its chrome. Kept until call sites drop it. */
  buttonClassName?: string;
  /** @deprecated No effect: the panel width follows the trigger. Kept until call sites drop it. */
  optionsClassName?: string;
  disabled?: boolean;
};

/**
 * `useTimezone` builds `query` as `"<value> <label>, <gmt_offset>, <utc_offset>"` and renders the
 * offset + label as JSX `content`. Propel rows and the trigger are text-only, so rebuild the
 * `"<utc_offset> <label>"` string the JSX shows.
 */
const getTimezoneLabel = (option: { value: string; query: string; content: ReactNode }): string => {
  if (typeof option.content === "string") return option.content;
  const prefix = `${option.value} `;
  if (!option.query.startsWith(prefix)) return option.value;
  const segments = option.query.slice(prefix.length).split(", ");
  if (segments.length < 3) return option.value;
  const utcOffset = segments.pop();
  segments.pop(); // gmt_offset
  return `${utcOffset} ${segments.join(", ")}`;
};

export const TimezoneSelect = observer(function TimezoneSelect(props: TTimezoneSelect) {
  // props
  const {
    value,
    onChange,
    error = false,
    errorMessage,
    fieldLabel,
    label = "Select a timezone",
    size = "lg",
    width,
    className = "",
    disabled = false,
  } = props;
  // hooks
  const { t } = useTranslation();
  const { contains } = useFilter();
  const { disabled: isDisabled, timezones } = useTimezone();
  // derived values
  const isSelectDisabled = Boolean(isDisabled) || disabled;
  const options: TTimezoneOption[] = timezones.map((option) => ({
    value: option.value,
    label: getTimezoneLabel(option),
    query: option.query,
  }));

  return (
    <div className={cn("w-full", className)}>
      <ComboboxField<string, TTimezoneOption>
        {...(fieldLabel !== undefined ? { label: fieldLabel, "aria-label": label } : { "aria-label": label })}
        size={size}
        width={width}
        items={options}
        value={value ?? null}
        onValueChange={(nextValue) => {
          if (nextValue !== null) onChange(nextValue);
        }}
        getItemValue={getTimezoneValue}
        getItemLabel={getOptionLabel}
        filter={(option, query) => contains(option.query, query)}
        empty={t("common.search.no_matches_found")}
        searchLabel={t("common.search.label")}
        placeholder={label}
        disabled={isSelectDisabled}
        error={errorMessage ?? (error ? true : undefined)}
      />
    </div>
  );
});
