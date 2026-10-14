/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ISSUE_PRIORITIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { PriorityIcon } from "../icons/priority-icon";
import type { TIssuePriorities } from "@plane/types";
import { Select } from "../select/select";
import type { SelectTooltip, SelectVariant } from "../select/types";

/** A single priority the picker offers. Sourced from the hardcoded `ISSUE_PRIORITIES` list. */
export type PriorityOption = {
  key: TIssuePriorities;
  title: string;
};

export type PrioritySelectProps = {
  /** Selected priority key (`null` / `undefined` when none). */
  value: TIssuePriorities | null | undefined;
  /** Emits the next priority key. */
  onChange: (value: TIssuePriorities) => void;
  /** Controls trigger chrome, button sizing, and arrow visibility. Use `icon-*` for prepend-only. */
  variant: SelectVariant;
  disabled?: boolean;
  placeholder?: string;
  onClose?: () => void;
  className?: string;
  tooltip?: SelectTooltip;
  /** Forwarded to the trigger as `data-testid` — value-agnostic e2e selector. */
  testId?: string;
  /** Tab order of the trigger, for forms that sequence focus explicitly (e.g. the work item create modal). */
  tabIndex?: number;
};

/**
 * Presentational priority picker built on the generic single-select `Select`. Unlike the other
 * property selects it owns its (hardcoded) option list — `ISSUE_PRIORITIES` — so it takes no
 * `getValues`. The client supplies only the selected key, an `onChange` that persists it, and the
 * trigger chrome via `variant`.
 */
export function PrioritySelect(props: PrioritySelectProps) {
  const {
    value,
    onChange,
    variant,
    disabled = false,
    placeholder = "",
    onClose,
    className,
    tooltip,
    testId,
    tabIndex,
  } = props;
  const { t } = useTranslation();

  const selected = value ? (ISSUE_PRIORITIES.find((priority) => priority.key === value) ?? null) : null;

  // Priority titles are shipped as English strings; prefer the localized copy keyed off `key`.
  const labelOf = (option: PriorityOption) => t(option.key) || option.title;

  return (
    <Select<PriorityOption>
      getValues={() => ISSUE_PRIORITIES}
      value={selected}
      onChange={(key) => onChange((key || "none") as TIssuePriorities)}
      disabled={disabled}
      placeholder={placeholder}
      showSearch={false}
      onClose={onClose}
      pinSelected={false}
      getOptionValue={(option) => option.key}
      getOptionLabel={labelOf}
      getOptionIcon={(option) => <PriorityIcon priority={option.key} className="size-4" />}
    >
      <Select.Trigger<PriorityOption>
        disabled={disabled}
        variant={variant}
        tabIndex={tabIndex}
        className={className}
        data-testid={testId}
        prependIcon={(priorities) => {
          const priority = priorities[0]?.key ?? "none";
          return <PriorityIcon priority={priority} />;
        }}
        label={(priorities) => (priorities[0] ? labelOf(priorities[0]) : placeholder)}
        tooltip={tooltip}
      >
        {(priorities) => {
          const priority = priorities[0];
          const label = priority ? labelOf(priority) : placeholder;
          return (!!priority || !!placeholder) && <span className="min-w-0 grow truncate text-left">{label}</span>;
        }}
      </Select.Trigger>
    </Select>
  );
}
