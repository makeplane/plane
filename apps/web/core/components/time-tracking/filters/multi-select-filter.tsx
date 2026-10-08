/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { CustomSearchSelect } from "@plane/ui";

export type TFilterOption = { value: string; label: string; hint?: string };

type Props = {
  value: string[];
  options: TFilterOption[];
  onChange: (value: string[]) => void;
  defaultOpen?: boolean;
};

/** A searchable multi-select whose button summarises the selection ("bug", "bug +2"). */
export function MultiSelectFilter({ value, options, onChange, defaultOpen }: Props) {
  const { t } = useTranslation();
  const first = options.find((option) => option.value === value[0]);
  const summary =
    value.length === 0
      ? t("time-tracking.filters.any")
      : `${first?.label ?? value[0]}${value.length > 1 ? ` +${value.length - 1}` : ""}`;

  return (
    <CustomSearchSelect
      value={value}
      onChange={(next: string[]) => onChange(next)}
      options={options.map((option) => ({
        value: option.value,
        query: `${option.label} ${option.hint ?? ""}`,
        content: (
          <span className="flex min-w-0 items-center gap-1.5">
            {option.hint && <span className="flex-shrink-0 text-11 text-tertiary">{option.hint}</span>}
            <span className="truncate">{option.label}</span>
          </span>
        ),
      }))}
      multiple
      defaultOpen={defaultOpen}
      customButton={<span className="max-w-40 truncate text-primary">{summary}</span>}
      customButtonClassName="px-1"
      optionsClassName="w-64"
      noChevron
    />
  );
}
