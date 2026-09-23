/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { StateGroupIcon } from "../icons/state/state-group-icon";
import type { TPaginatedResponse, TStateGroups } from "@plane/types";
import { Select } from "../select/select";
import type { SelectPaginationParams, SelectTooltip, SelectVariant } from "../select/types";
import type { ReactNode } from "react";
import { ProjectIdentifierElement } from "./shared/project-identifier-element";

/** Minimal state shape the dropdown needs — the client maps its richer record down to this. */
export type StateOption = {
  id: string;
  name: string;
  color: string;
  group: TStateGroups;
  order?: number;
  /** Owning project's short code, shown as a pill when `showIdentifier` is set. */
  identifier?: string;
};

export type StateSelectProps = {
  /** Paginated fetcher, bound by the client to the state lite service (cursor + optional server search). */
  getValues: (params: SelectPaginationParams) => Promise<TPaginatedResponse<StateOption[]>>;
  /** Selected state as a full object (resolved by the client from `state_id`), or `null` when none. */
  value: StateOption | null;
  /** Emits the next selected state id. */
  onChange: (id: string) => void;
  /** Controls trigger chrome, button sizing, and arrow visibility. */
  variant: SelectVariant;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  onClose?: () => void;
  className?: string;
  /**
   * When provided, only states whose id is in this set are shown. Pass `null` (or omit) to show all
   * states — used when workflows are disabled or unavailable.
   */
  allowedStateIds?: Set<string> | null;
  /** Shows each option's `identifier` as a pill, for a picker scoped across several projects. */
  showIdentifier?: boolean;
  tooltip?: SelectTooltip;
  appendElement?: ReactNode;
  /** Forwarded to `Select.Trigger`'s `testId` — see its doc comment (value-agnostic e2e selector). */
  testId?: string;
  /** Tab order of the trigger, for forms that sequence focus explicitly (e.g. the work item create modal). */
  tabIndex?: number;
};

/**
 * Presentational, data-source-agnostic state picker built on the generic single-select `Select`.
 * The client supplies `getValues` (bound to the state lite list), the selected `value` object, and
 * an `onChange` that persists the chosen id — this block owns only the state-specific markup.
 */
export function StateSelect(props: StateSelectProps) {
  const {
    getValues,
    value,
    onChange,
    disabled = false,
    placeholder = "",
    searchPlaceholder = "Search states...",
    onClose,
    className,
    allowedStateIds = null,
    showIdentifier = false,
    tooltip,
    appendElement,
    testId,
    tabIndex,
  } = props;

  const { variant } = props;
  const shouldFilterStates = allowedStateIds !== null;

  return (
    <Select<StateOption>
      infinite
      getValues={getValues}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      onClose={onClose}
      pinSelected={false}
      getOptionValue={(state) => state.id}
      getOptionLabel={(state) => state.name}
      filterOption={shouldFilterStates ? (state) => allowedStateIds.has(state.id) : undefined}
      getOptionIcon={(state) => (
        <StateGroupIcon
          stateGroup={state.group}
          color={state.color}
          className="size-4 shrink-0"
          percentage={state.order}
        />
      )}
      getOptionTrailing={
        showIdentifier
          ? (state) => (state.identifier ? <ProjectIdentifierElement show identifier={state.identifier} /> : undefined)
          : undefined
      }
    >
      <Select.Trigger<StateOption>
        disabled={disabled}
        variant={variant}
        tabIndex={tabIndex}
        className={className}
        data-testid={testId}
        prependIcon={(states) => (
          <StateGroupIcon
            stateGroup={states[0]?.group ?? "backlog"}
            color={states[0]?.color ?? "currentColor"}
            percentage={states[0]?.order}
            size="md"
          />
        )}
        label={(states) => states[0]?.name ?? placeholder}
        tooltip={tooltip}
      >
        {(states) => {
          const selected = states[0];
          const label = selected?.name ?? placeholder;
          return (
            (!!selected || !!placeholder) && (
              <span className="flex min-w-0 grow items-center gap-2 truncate text-left">
                <span className="truncate">{label}</span>
                {selected?.name && appendElement ? appendElement : undefined}
              </span>
            )
          );
        }}
      </Select.Trigger>
    </Select>
  );
}
