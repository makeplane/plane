/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Swatch } from "@makeplane/propel/elements/swatch";
import { useTranslation } from "@plane/i18n";
import { LabelPropertyIcon } from "../../icons/properties/label-icon";
import type { TPaginatedResponse } from "@plane/types";
import { Select } from "../../select/select";
import type { SelectPaginationParams, SelectTooltip, SelectVariant } from "../../select/types";
import { splitSelectVariant } from "../../select/utils";
import { ProjectIdentifierElement } from "../shared/project-identifier-element";
import { CreateLabelEmptyState } from "./create-label-empty-state";
import { LabelPill } from "./label-pill";

/** Minimal label shape the dropdown needs — the client maps its richer record down to this. */
export type LabelOption = {
  id: string;
  name: string;
  color: string;
  identifier?: string;
};

export type LabelSelectProps = {
  /** Paginated fetcher, bound by the client to the label lite service (cursor + optional server search). */
  getValues: (params: SelectPaginationParams) => Promise<TPaginatedResponse<LabelOption[]>>;
  /** Selected labels as full objects (resolved by the client from `label_ids`). */
  value: LabelOption[];
  /** Emits the next set of selected label ids. */
  onChange: (ids: string[]) => void;
  /** Controls trigger chrome, button sizing, and arrow visibility. */
  variant: SelectVariant;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  onClose?: () => void;
  /** Forwarded to the trigger as `data-testid` — value-agnostic e2e selector. */
  testId?: string;
  /**
   * When provided (together with a truthy `canCreateLabel`), a search that comes back empty shows a
   * "+ Add <query> to labels" row that creates and immediately selects a new label.
   */
  createLabel?: {
    onCreate?: (name: string) => Promise<LabelOption>;
    canCreate?: boolean;
  };
  className?: string;
  showIdentifier?: boolean;
  tooltip?: SelectTooltip;
  /** Tab order of the trigger, for forms that sequence focus explicitly (e.g. the work item create modal). */
  tabIndex?: number;
  /**
   * Shows the label property icon in the trigger while nothing is selected. Turn it off where the
   * property row already labels the field, e.g. the work item sidebar.
   *
   * @default true
   */
  showEmptyIcon?: boolean;
};

/** Label colour for a swatch — a label that has not loaded yet has no colour. */
const swatchFill = (label: LabelOption) => label.color || "currentColor";

/**
 * Presentational, data-source-agnostic label picker built on the generic multi-select `Select`.
 * The client supplies `getValues` (bound to the label lite list), the selected `value` objects, and
 * an `onChange` that persists the chosen ids — this block owns only the label-specific markup.
 */
export function LabelSelect(props: LabelSelectProps) {
  const {
    getValues,
    value,
    onChange,
    disabled = false,
    placeholder = "",
    searchPlaceholder = "Search labels...",
    onClose,
    createLabel,
    className,
    showIdentifier = false,
    tooltip,
    testId,
    tabIndex,
    showEmptyIcon = true,
  } = props;

  const { variant } = props;
  const { t } = useTranslation();
  const isSelectKind = ["select", "select-ghost"].includes(splitSelectVariant(variant).variant);

  const handleLabelCreated = (id: string) => {
    onChange([...value.map((label) => label.id), id]);
  };

  const emptyMessage = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return t("no_matching_labels");
    return (
      <CreateLabelEmptyState
        query={trimmed}
        canCreate={!!createLabel?.canCreate}
        onCreateLabel={createLabel?.onCreate}
        onCreated={handleLabelCreated}
      />
    );
  };

  return (
    <Select<LabelOption>
      infinite
      multiple
      getValues={getValues}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      onClose={onClose}
      getOptionValue={(label) => label.id}
      getOptionLabel={(label) => label.name}
      getOptionIcon={(label) => <Swatch fill={swatchFill(label)} />}
      getOptionTrailing={
        showIdentifier
          ? (label) => (label.identifier ? <ProjectIdentifierElement show identifier={label.identifier} /> : undefined)
          : undefined
      }
    >
      <Select.Trigger<LabelOption>
        disabled={disabled}
        variant={variant}
        tabIndex={tabIndex}
        className={className}
        data-testid={testId}
        prependIcon={(labels) => (labels.length === 0 && showEmptyIcon ? <LabelPropertyIcon /> : undefined)}
        label={(labels) =>
          labels.length === 0
            ? (placeholder ?? "")
            : labels.length === 1
              ? labels[0].name
              : t("labels_count", { count: labels.length })
        }
        tooltip={tooltip}
      >
        {(labels) => {
          if (labels.length === 0) {
            return !!placeholder && <span className="min-w-0 grow truncate text-left">{placeholder}</span>;
          }
          // select / select-ghost variants list every selected label as a soft label pill
          if (isSelectKind) {
            return (
              <div className="flex min-w-0 grow flex-wrap items-center gap-1">
                {labels.map((label) => (
                  <LabelPill key={label.id} label={label} variant="soft" />
                ))}
              </div>
            );
          }
          // inline / table-cell: single swatch + name for 1, first swatch + the pluralised count for multiple
          const [firstLabel] = labels;
          return (
            <>
              <Swatch fill={swatchFill(firstLabel)} />
              <span className="min-w-0 grow truncate text-left">
                {labels.length === 1 ? firstLabel.name : t("labels_count", { count: labels.length })}
              </span>
            </>
          );
        }}
      </Select.Trigger>
    </Select>
  );
}
