/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
// plane imports
import { EstimateOutline } from "@makeplane/propel/icons";
import type { TPaginatedResponse } from "@plane/types";
// local imports
import type { SelectPaginationParams, SelectTooltip, SelectVariant } from "../select/types";
import { Select } from "../select/select";

/** Minimal estimate point shape the dropdown needs — the client resolves the id and pre-formats the display value. */
export type EstimateOption = {
  id: string;
  displayValue: string;
};

/** Id for the "No estimate" clear option — an empty string maps back to `null`/`undefined` via `id || undefined`. */
const CLEAR_OPTION_ID = "";

export type EstimateSelectProps = {
  /** Fetches lazily, once per open — the client resolves/loads the project's active estimate system
   * only when the dropdown is actually opened, not on mount. */
  getValues: (params: SelectPaginationParams) => Promise<TPaginatedResponse<EstimateOption[]>>;
  /** Selected estimate point as a full object (resolved by the client from an estimate point id), or `null` when none. */
  value: EstimateOption | null;
  /** Emits the next selected estimate point id (empty string clears the selection). */
  onChange: (id: string) => void;
  /** Controls trigger chrome, button sizing, and arrow visibility. */
  variant: SelectVariant;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  onClose?: () => void;
  className?: string;
  /** Pins a "No estimate" row to the top of the list; selecting it emits an empty string (clears the selection). Defaults to `true`. */
  clearable?: boolean;
  /** Label for the clear row. Defaults to `placeholder`, then `"No estimate"`. */
  clearLabel?: string;
  tooltip?: SelectTooltip;
  /** Tab order of the trigger, for forms that sequence focus explicitly (e.g. the work item create modal). */
  tabIndex?: number;
};

/**
 * Presentational, data-source-agnostic estimate picker built on the generic single-select `Select`.
 * The client supplies `getValues` (bound to the project's active estimate system), the selected
 * `value` object, and an `onChange` that persists the chosen id — this block owns only the
 * estimate-specific markup (formatting, e.g. time-based estimates, is resolved by the client).
 */
export function EstimateSelect(props: EstimateSelectProps) {
  const {
    getValues,
    value,
    onChange,
    disabled = false,
    placeholder = "",
    searchPlaceholder = "Search estimates...",
    onClose,
    variant,
    className,
    clearable = true,
    clearLabel,
    tooltip,
    tabIndex,
  } = props;
  // derived values

  const resolvedClearLabel = clearLabel ?? (placeholder || "No estimate");
  const clearOption = useMemo<EstimateOption>(
    () => ({ id: CLEAR_OPTION_ID, displayValue: resolvedClearLabel }),
    [resolvedClearLabel]
  );

  return (
    <Select<EstimateOption>
      infinite
      getValues={getValues}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      onClose={onClose}
      headerItems={clearable ? [clearOption] : undefined}
      getOptionValue={(estimate) => estimate.id}
      getOptionLabel={(estimate) => estimate.displayValue}
      getOptionIcon={() => <EstimateOutline className="size-4 shrink-0 text-primary" />}
    >
      <Select.Trigger<EstimateOption>
        disabled={disabled}
        variant={variant}
        tabIndex={tabIndex}
        className={className}
        prependIcon={<EstimateOutline />}
        label={(estimates) => estimates[0]?.displayValue ?? placeholder}
        tooltip={tooltip}
      >
        {(estimates) => {
          const selected = estimates[0];
          const label = selected?.displayValue ?? placeholder;
          return (
            <>{(!!selected || !!placeholder) && <span className="min-w-0 grow truncate text-left">{label}</span>}</>
          );
        }}
      </Select.Trigger>
    </Select>
  );
}
