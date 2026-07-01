/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { Control, UseFieldArrayReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TProjectTemplateIssuePriority } from "@plane/types";
import { CustomSelect, Input } from "@plane/ui";
// local imports
import type { TProjectTemplateForm } from "../utils";
import { Section } from "./section";

const PRIORITIES: TProjectTemplateIssuePriority[] = ["urgent", "high", "medium", "low", "none"];

const PRIORITY_LABELS: Record<TProjectTemplateIssuePriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "None",
};

type TOptionItem = {
  /** RHF field-array id of the source row — used as the dropdown value. */
  id: string;
  /** Display label (name). */
  name: string;
  color?: string;
};

type TStarterIssuesSection = {
  control: Control<TProjectTemplateForm>;
  array: UseFieldArrayReturn<TProjectTemplateForm, "payload.starter_issues">;
  disabled?: boolean;
  clientError?: string;
  backendError?: string;
  /** Source rows for the state reference dropdown (single-select). */
  stateOptions: TOptionItem[];
  /** Source rows for the labels reference dropdown (multi-select). */
  labelOptions: TOptionItem[];
  /** Source rows for the module reference dropdown (single-select). */
  moduleOptions: TOptionItem[];
  /** Source rows for the cycle reference dropdown (single-select). */
  cycleOptions: TOptionItem[];
};

/**
 * Starter issues section: inline add/edit/remove rows. Reference dropdowns
 * pick from the in-editor state/labels/modules/cycles by NAME; the form
 * stores the SOURCE ROW's RHF field-array id, and `assemblePayload` resolves
 * the id to the current stable `*_key` on submit (D-13 / RESEARCH Pitfall 2).
 *
 * No raw `*_key` field is rendered — admins work with names only (D-12).
 */
export const StarterIssuesSection = observer(function StarterIssuesSection(props: TStarterIssuesSection) {
  const {
    control,
    array,
    disabled,
    clientError,
    backendError,
    stateOptions,
    labelOptions,
    moduleOptions,
    cycleOptions,
  } = props;
  const { fields, append, remove } = array;
  const { t } = useTranslation();

  const handleAdd = () => {
    append({
      name: "",
      state_ref_id: null,
      label_ref_ids: [],
      module_ref_id: null,
      cycle_ref_id: null,
      priority: "none" as TProjectTemplateIssuePriority,
    });
  };

  const handleRemove = (idx: number) => {
    remove(idx);
  };

  return (
    <Section
      title={t("workspace_settings.settings.project_templates.editor.starter_issues_section_title")}
      error={backendError ?? clientError}
      action={
        !disabled && (
          <Button variant="secondary" size="sm" onClick={handleAdd} prependIcon={<Plus className="size-3" />}>
            {t("workspace_settings.settings.project_templates.editor.add_starter_issue")}
          </Button>
        )
      }
    >
      {fields.length === 0 ? (
        <p className="text-body-xs-regular text-tertiary">
          {t("workspace_settings.settings.project_templates.editor.starter_issues_empty_hint")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {fields.map((row, idx) => (
            <StarterIssueRow
              key={row.id}
              control={control}
              idx={idx}
              disabled={disabled}
              stateOptions={stateOptions}
              labelOptions={labelOptions}
              moduleOptions={moduleOptions}
              cycleOptions={cycleOptions}
              onRemove={() => handleRemove(idx)}
            />
          ))}
        </div>
      )}
    </Section>
  );
});

type TStarterIssueRow = {
  control: Control<TProjectTemplateForm>;
  idx: number;
  disabled?: boolean;
  stateOptions: TOptionItem[];
  labelOptions: TOptionItem[];
  moduleOptions: TOptionItem[];
  cycleOptions: TOptionItem[];
  onRemove: () => void;
};

const StarterIssueRow = observer(function StarterIssueRow(props: TStarterIssueRow) {
  const { control, idx, disabled, stateOptions, labelOptions, moduleOptions, cycleOptions, onRemove } = props;
  const { t } = useTranslation();

  // Friendly labels for the dropdown trigger button. For the value to label
  // mapping we use a closure over the option arrays so renames flow through.
  const labelForState = (id: string | null | undefined): string => {
    if (!id) return t("workspace_settings.settings.project_templates.editor.no_reference");
    const found = stateOptions.find((o) => o.id === id);
    return found?.name || t("workspace_settings.settings.project_templates.editor.no_reference");
  };
  const labelForModule = (id: string | null | undefined): string => {
    if (!id) return t("workspace_settings.settings.project_templates.editor.no_reference");
    const found = moduleOptions.find((o) => o.id === id);
    return found?.name || t("workspace_settings.settings.project_templates.editor.no_reference");
  };
  const labelForCycle = (id: string | null | undefined): string => {
    if (!id) return t("workspace_settings.settings.project_templates.editor.no_reference");
    const found = cycleOptions.find((o) => o.id === id);
    return found?.name || t("workspace_settings.settings.project_templates.editor.no_reference");
  };
  const labelForPriority = (value: TProjectTemplateIssuePriority | undefined): string =>
    value ? PRIORITY_LABELS[value] : t("workspace_settings.settings.project_templates.editor.no_reference");
  const labelsLabel = (ids: string[] | undefined): string => {
    if (!ids || ids.length === 0) return t("workspace_settings.settings.project_templates.editor.no_reference");
    const names = ids.map((id) => labelOptions.find((o) => o.id === id)?.name).filter((n): n is string => Boolean(n));
    if (names.length === 0) return t("workspace_settings.settings.project_templates.editor.no_reference");
    if (names.length === 1) return names[0];
    return `${names[0]} +${names.length - 1}`;
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border border-subtle bg-layer-1 px-3 py-2">
      <div className="flex items-center gap-3">
        {/* Name */}
        <Controller
          name={`payload.starter_issues.${idx}.name`}
          control={control}
          rules={{ required: true, maxLength: 255 }}
          render={({ field, fieldState: { error } }) => (
            <div className="flex flex-1 flex-col">
              <Input
                {...field}
                value={field.value ?? ""}
                hasError={Boolean(error)}
                placeholder={t("workspace_settings.settings.project_templates.editor.starter_issue_name_placeholder")}
                disabled={disabled}
              />
            </div>
          )}
        />

        {/* Priority */}
        <Controller
          name={`payload.starter_issues.${idx}.priority`}
          control={control}
          render={({ field }) => (
            <CustomSelect
              value={field.value ?? "none"}
              label={labelForPriority(field.value as TProjectTemplateIssuePriority | undefined)}
              onChange={(v: TProjectTemplateIssuePriority) => field.onChange(v)}
              disabled={disabled}
              input
            >
              {PRIORITIES.map((p) => (
                <CustomSelect.Option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
        />

        {/* Remove */}
        {!disabled && (
          <button
            type="button"
            className="flex size-6 shrink-0 items-center justify-center rounded-sm text-tertiary transition-colors hover:bg-layer-2 hover:text-danger-primary"
            onClick={onRemove}
            aria-label={t("workspace_settings.settings.project_templates.editor.remove")}
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>

      {/* Reference dropdowns (second row) */}
      <div className="flex items-center gap-3">
        {/* State (required by backend) */}
        <Controller
          name={`payload.starter_issues.${idx}.state_ref_id`}
          control={control}
          render={({ field }) => (
            <CustomSelect
              value={(field.value as string | null) ?? ""}
              label={labelForState(field.value as string | null | undefined)}
              onChange={(v: string) => field.onChange(v || null)}
              disabled={disabled}
              input
            >
              <CustomSelect.Option value="">
                {t("workspace_settings.settings.project_templates.editor.no_reference")}
              </CustomSelect.Option>
              {stateOptions.map((o) => (
                <CustomSelect.Option key={o.id} value={o.id}>
                  {o.name || t("workspace_settings.settings.project_templates.editor.state_label")}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
        />

        {/* Labels (multi) — `CustomSelect` is single-value so we render one
            toggle per known label and reflect selection via small chips. This
            matches the "pick by name" contract (D-13) without dragging in a
            new multi-select primitive that the rest of the editor avoids. */}
        <Controller
          name={`payload.starter_issues.${idx}.label_ref_ids`}
          control={control}
          render={({ field }) => {
            const selected = (field.value as string[] | undefined) ?? [];
            const toggle = (id: string) => {
              if (selected.includes(id)) {
                field.onChange(selected.filter((x) => x !== id));
              } else {
                field.onChange([...selected, id]);
              }
            };
            return (
              <div className="flex max-w-md flex-1 flex-wrap items-center gap-1">
                {labelOptions.length === 0 ? (
                  <span className="text-body-xs-regular text-tertiary">
                    {t("workspace_settings.settings.project_templates.editor.no_reference")}
                  </span>
                ) : (
                  labelOptions.map((o) => {
                    const isOn = selected.includes(o.id);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggle(o.id)}
                        className={
                          "rounded-full border px-2 py-0.5 text-11 transition-colors " +
                          (isOn
                            ? "border-accent-strong bg-accent-primary/10 text-primary"
                            : "border-subtle text-secondary hover:border-strong hover:text-primary")
                        }
                        aria-pressed={isOn}
                      >
                        {o.name || t("workspace_settings.settings.project_templates.editor.labels_label")}
                      </button>
                    );
                  })
                )}
                {/* Hidden text for screen readers summarizing the selection. */}
                <span className="sr-only">{labelsLabel(selected)}</span>
              </div>
            );
          }}
        />

        {/* Module (optional) */}
        <Controller
          name={`payload.starter_issues.${idx}.module_ref_id`}
          control={control}
          render={({ field }) => (
            <CustomSelect
              value={(field.value as string | null) ?? ""}
              label={labelForModule(field.value as string | null | undefined)}
              onChange={(v: string) => field.onChange(v || null)}
              disabled={disabled}
              input
            >
              <CustomSelect.Option value="">
                {t("workspace_settings.settings.project_templates.editor.no_reference")}
              </CustomSelect.Option>
              {moduleOptions.map((o) => (
                <CustomSelect.Option key={o.id} value={o.id}>
                  {o.name || t("workspace_settings.settings.project_templates.editor.module_label")}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
        />

        {/* Cycle (optional) */}
        <Controller
          name={`payload.starter_issues.${idx}.cycle_ref_id`}
          control={control}
          render={({ field }) => (
            <CustomSelect
              value={(field.value as string | null) ?? ""}
              label={labelForCycle(field.value as string | null | undefined)}
              onChange={(v: string) => field.onChange(v || null)}
              disabled={disabled}
              input
            >
              <CustomSelect.Option value="">
                {t("workspace_settings.settings.project_templates.editor.no_reference")}
              </CustomSelect.Option>
              {cycleOptions.map((o) => (
                <CustomSelect.Option key={o.id} value={o.id}>
                  {o.name || t("workspace_settings.settings.project_templates.editor.cycle_label")}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
        />
      </div>
    </div>
  );
});
