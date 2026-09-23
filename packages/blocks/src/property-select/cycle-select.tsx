/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CyclesOutline } from "@makeplane/propel/icons";
import { CycleGroupIcon } from "../icons";
import type { TCycleGroups, TPaginatedResponse } from "@plane/types";
// local imports
import type { SelectPaginationParams, SelectTooltip, SelectVariant } from "../select";
import { Select } from "../select";
import { ProjectIdentifierElement } from "./shared";

/** Minimal cycle shape the dropdown needs — the client maps its richer record down to this. */
export type CycleOption = {
  id: string;
  name: string;
  /** Date-derived cycle status; omit for the "No cycle" clear row. */
  status?: TCycleGroups;
  /** Owning project's short code, shown as a pill when `showIdentifier` is set. */
  identifier?: string;
};

/** Id for the "No cycle" clear option — an empty string maps back to `null` via `id || null`. */
const CLEAR_OPTION_ID = "";

export type CycleSelectProps = {
  /** Paginated fetcher, bound by the client to the cycle lite service (cursor + optional server search). */
  getValues: (params: SelectPaginationParams) => Promise<TPaginatedResponse<CycleOption[]>>;
  /** Selected cycle as a full object (resolved by the client from `cycle_id`), or `null` when none. */
  value: CycleOption | null;
  /** Emits the next selected cycle id (empty string clears the selection). */
  onChange: (id: string) => void;
  /** Controls trigger chrome, button sizing, and arrow visibility. */
  variant: SelectVariant;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  onClose?: () => void;
  className?: string;
  /** Pins a "No cycle" row to the top of the list; selecting it emits an empty string (clears the selection). Defaults to `true`. */
  clearable?: boolean;
  /** Label for the clear row. Defaults to `placeholder`, then `"No cycle"`. */
  clearLabel?: string;
  /** Shows each option's `identifier` as a pill, for a picker scoped across several projects. */
  showIdentifier?: boolean;
  tooltip?: SelectTooltip;
  /** Tab order of the trigger, for forms that sequence focus explicitly (e.g. the work item create modal). */
  tabIndex?: number;
};

/**
 * Presentational, data-source-agnostic cycle picker built on the generic single-select `Select`.
 * The client supplies `getValues` (bound to the cycle lite list), the selected `value` object, and
 * an `onChange` that persists the chosen id — this block owns only the cycle-specific markup.
 */
export function CycleSelect(props: CycleSelectProps) {
  const {
    getValues,
    value,
    onChange,
    disabled = false,
    placeholder = "",
    searchPlaceholder = "Search cycles...",
    onClose,
    variant,
    className,
    clearable = true,
    clearLabel,
    showIdentifier = false,
    tooltip,
    tabIndex,
  } = props;
  // translation
  const { t } = useTranslation();
  // derived values

  const resolvedClearLabel = clearLabel ?? (placeholder || t("cycle.no_cycle"));
  const clearOption = useMemo<CycleOption>(
    () => ({ id: CLEAR_OPTION_ID, name: resolvedClearLabel }),
    [resolvedClearLabel]
  );

  return (
    <Select<CycleOption>
      infinite
      getValues={getValues}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      onClose={onClose}
      headerItems={clearable ? [clearOption] : undefined}
      getOptionValue={(cycle) => cycle.id}
      getOptionLabel={(cycle) => cycle.name}
      getOptionIcon={(cycle) =>
        cycle.status ? (
          <CycleGroupIcon cycleGroup={cycle.status} className="size-4 shrink-0" />
        ) : (
          <CyclesOutline className="size-4 shrink-0 text-primary" />
        )
      }
      getOptionTrailing={
        showIdentifier
          ? (cycle) => (cycle.identifier ? <ProjectIdentifierElement show identifier={cycle.identifier} /> : undefined)
          : undefined
      }
    >
      <Select.Trigger<CycleOption>
        disabled={disabled}
        variant={variant}
        tabIndex={tabIndex}
        className={className}
        prependIcon={(cycles) =>
          cycles[0]?.status ? (
            <CycleGroupIcon cycleGroup={cycles[0].status} className="size-3.5 shrink-0" />
          ) : (
            <CyclesOutline />
          )
        }
        label={(cycles) => cycles[0]?.name ?? placeholder}
        tooltip={tooltip}
      >
        {(cycles) => {
          const selected = cycles[0];
          const label = selected?.name ?? placeholder;
          return (
            <>{(!!selected || !!placeholder) && <span className="min-w-0 grow truncate text-left">{label}</span>}</>
          );
        }}
      </Select.Trigger>
    </Select>
  );
}
