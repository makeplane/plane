/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { IntakeStateGroupIcon } from "../icons";
import type { TPaginatedResponse, TIntakeStateGroups } from "@plane/types";
import { Select } from "../select";
import type { SelectPaginationParams, SelectVariant } from "../select";

/** Minimal intake state shape the dropdown needs; the web layer maps its store record down to this. */
export type IntakeStateOption = {
  id: string;
  name: string;
  color: string;
  group: TIntakeStateGroups;
};

export type IntakeStateSelectProps = {
  /** Fetcher bound by the client to the project intake-state singleton. */
  getValues: (params: SelectPaginationParams) => Promise<TPaginatedResponse<IntakeStateOption[]>>;
  /** Selected intake state as a full object, or `null` when unavailable. */
  value: IntakeStateOption | null;
  /** Emits the next selected intake state id. */
  onChange: (id: string) => void;
  /** Controls trigger chrome, button sizing, and arrow visibility. */
  variant: SelectVariant;
  disabled?: boolean;
  placeholder?: string;
  onClose?: () => void;
  className?: string;
  /** Tab order of the trigger, for forms that sequence focus explicitly (e.g. the work item create modal). */
  tabIndex?: number;
};

/**
 * Presentational intake-state picker built on the generic single-select `Select`.
 * Intake state is a project singleton, so this block owns only the intake icon/label markup.
 */
export function IntakeStateSelect(props: IntakeStateSelectProps) {
  const {
    getValues,
    value,
    onChange,
    variant,
    disabled = false,
    placeholder = "",
    onClose,
    className,
    tabIndex,
  } = props;

  return (
    <Select<IntakeStateOption>
      infinite
      getValues={getValues}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      showSearch={false}
      onClose={onClose}
      getOptionValue={(state) => state.id}
      getOptionLabel={(state) => state.name}
      getOptionIcon={(state) => (
        <IntakeStateGroupIcon stateGroup={state.group} color={state.color} className="size-4 shrink-0" />
      )}
    >
      <Select.Trigger<IntakeStateOption>
        disabled={disabled}
        variant={variant}
        tabIndex={tabIndex}
        className={className}
        prependIcon={(states) => (
          <IntakeStateGroupIcon
            stateGroup={states[0]?.group ?? "triage"}
            color={states[0]?.color ?? "currentColor"}
            size="md"
          />
        )}
        label={(states) => states[0]?.name ?? placeholder}
      >
        {(states) => {
          const selected = states[0];
          const label = selected?.name ?? placeholder;
          return (
            <>{(!!selected || !!placeholder) && <span className="min-w-0 grow truncate text-left">{label}</span>}</>
          );
        }}
      </Select.Trigger>
    </Select>
  );
}
