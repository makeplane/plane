/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { observer } from "mobx-react";
// plane imports
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxSearch,
  ComboboxTrigger,
  useFilter,
} from "@makeplane/propel/components/combobox";
import type { ComboboxSize } from "@makeplane/propel/components/combobox";
import { Field } from "@makeplane/propel/components/field";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// hooks
import useTimezone from "@/hooks/use-timezone";

/** The searchable option shape `useTimezone` emits, plus the plain-text label Propel rows need. */
type TTimezoneOption = {
  value: string;
  label: string;
  query: string;
  content: ReactNode;
};

type TTimezoneSelect = {
  value: string | undefined;
  onChange: (value: string) => void;
  error?: boolean;
  label?: string;
  size?: ComboboxSize;
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
    label = "Select a timezone",
    size = "lg",
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
    content: option.content,
  }));
  const selectedOption = options.find((option) => option.value === value) ?? null;

  return (
    <div className={cn("w-full", className)}>
      <Field size={size} invalid={error} disabled={isSelectDisabled}>
        <Combobox<TTimezoneOption, false>
          items={options}
          value={selectedOption}
          onValueChange={(nextValue) => {
            if (nextValue) onChange(nextValue.value);
          }}
          itemToStringLabel={(option) => option.label}
          itemToStringValue={(option) => option.value}
          isItemEqualToValue={(option, selected) => option.value === selected.value}
          filter={(option, query) => contains(option.query, query)}
          disabled={isSelectDisabled}
        >
          <ComboboxTrigger size={size} placeholder={label} />
          <ComboboxContent
            aria-label={label}
            sizing="anchor"
            search={<ComboboxSearch placeholder={t("common.search.label")} aria-label={t("common.search.label")} />}
          >
            <ComboboxEmpty>{t("common.search.no_matches_found")}</ComboboxEmpty>
            <ComboboxList aria-label={label}>
              {(option: TTimezoneOption) => <ComboboxItem key={option.value} value={option} label={option.label} />}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Field>
    </div>
  );
});
