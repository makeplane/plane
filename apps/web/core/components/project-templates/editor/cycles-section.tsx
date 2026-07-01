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
import { Input } from "@plane/ui";
// local imports
import type { TProjectTemplateForm } from "../utils";
import { slugifyKey, uniqueKey } from "../utils";
import { Section } from "./section";

type TCyclesSection = {
  control: Control<TProjectTemplateForm>;
  array: UseFieldArrayReturn<TProjectTemplateForm, "payload.cycles">;
  disabled?: boolean;
  clientError?: string;
  backendError?: string;
};

/**
 * Cycles section: inline add/edit/remove rows + offset validation.
 * Stable `cycle_key` is generated ONCE at add-time (D-12 / RESEARCH Pitfall 2).
 * Enforces `start_offset_days <= target_offset_days` client-side
 * (RESEARCH Pitfall 4 / serializers/project_template.py:43-60).
 */
export const CyclesSection = observer(function CyclesSection(props: TCyclesSection) {
  const { control, array, disabled, clientError, backendError } = props;
  const { fields, append, remove } = array;
  const { t } = useTranslation();

  const usedKeys = new Set(fields.map((c) => c.cycle_key));

  const handleAdd = () => {
    const base = slugifyKey(`cycle_${fields.length + 1}`);
    const newKey = uniqueKey(base, usedKeys);
    append({
      cycle_key: newKey,
      name: "",
      start_offset_days: null,
      target_offset_days: null,
      duration_days: null,
    });
  };

  const handleRemove = (idx: number) => {
    remove(idx);
  };

  return (
    <Section
      title={t("workspace_settings.settings.project_templates.editor.cycles_section_title")}
      error={backendError ?? clientError}
      action={
        !disabled && (
          <Button variant="secondary" size="sm" onClick={handleAdd} prependIcon={<Plus className="size-3" />}>
            {t("workspace_settings.settings.project_templates.editor.add_cycle")}
          </Button>
        )
      }
    >
      {fields.length === 0 ? (
        <p className="text-body-xs-regular text-tertiary">
          {t("workspace_settings.settings.project_templates.editor.cycles_empty_hint")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {fields.map((row, idx) => (
            <CycleRow
              key={row.id}
              control={control}
              rowId={row.id}
              idx={idx}
              startValue={row.start_offset_days}
              targetValue={row.target_offset_days}
              disabled={disabled}
              onRemove={() => handleRemove(idx)}
            />
          ))}
        </div>
      )}
    </Section>
  );
});

type TCycleRow = {
  control: Control<TProjectTemplateForm>;
  rowId: string;
  idx: number;
  startValue: number | null | undefined;
  targetValue: number | null | undefined;
  disabled?: boolean;
  onRemove: () => void;
};

/**
 * One cycle row. Computes its own inline offset-error message and renders it
 * under the row so per-row violations are visible (Pitfall 4). Hidden when
 * the row is otherwise valid so the row stays compact.
 */
const CycleRow = observer(function CycleRow(props: TCycleRow) {
  const { control, idx, startValue, targetValue, disabled, onRemove } = props;
  const { t } = useTranslation();
  const startNum = typeof startValue === "number" ? startValue : null;
  const targetNum = typeof targetValue === "number" ? targetValue : null;
  const hasBoth = startNum !== null && targetNum !== null;
  const offsetError =
    hasBoth && startNum > targetNum
      ? t("workspace_settings.settings.project_templates.editor.cycle_offsets_invalid")
      : null;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3 rounded-md border border-subtle bg-layer-1 px-3 py-2">
        {/* Name */}
        <Controller
          name={`payload.cycles.${idx}.name`}
          control={control}
          rules={{ required: true, maxLength: 255 }}
          render={({ field, fieldState: { error } }) => (
            <div className="flex flex-1 flex-col">
              <Input
                {...field}
                value={field.value ?? ""}
                hasError={Boolean(error)}
                placeholder={t("workspace_settings.settings.project_templates.editor.cycle_name_placeholder")}
                disabled={disabled}
              />
            </div>
          )}
        />

        {/* Start offset */}
        <Controller
          name={`payload.cycles.${idx}.start_offset_days`}
          control={control}
          render={({ field }) => (
            <OffsetInput
              value={field.value as number | null | undefined}
              onChange={field.onChange}
              placeholder={t("workspace_settings.settings.project_templates.editor.cycle_start_offset")}
              disabled={disabled}
            />
          )}
        />

        {/* Target offset */}
        <Controller
          name={`payload.cycles.${idx}.target_offset_days`}
          control={control}
          render={({ field }) => (
            <OffsetInput
              value={field.value as number | null | undefined}
              onChange={field.onChange}
              placeholder={t("workspace_settings.settings.project_templates.editor.cycle_target_offset")}
              disabled={disabled}
            />
          )}
        />

        {/* Duration */}
        <Controller
          name={`payload.cycles.${idx}.duration_days`}
          control={control}
          render={({ field }) => (
            <OffsetInput
              value={field.value as number | null | undefined}
              onChange={field.onChange}
              placeholder={t("workspace_settings.settings.project_templates.editor.cycle_duration")}
              disabled={disabled}
            />
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
      {offsetError && (
        <p className="text-body-xs-regular text-danger-primary" role="alert">
          {offsetError}
        </p>
      )}
    </div>
  );
});

type TOffsetInput = {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  placeholder: string;
  disabled?: boolean;
};

/**
 * Numeric input that round-trips a nullable integer. The backend rejects
 * non-integer / boolean values for offset fields
 * (serializers/project_template.py:21-41), so we coerce empty strings and
 * non-numeric input to `null` and only emit integers.
 */
function OffsetInput(props: TOffsetInput) {
  const { value, onChange, placeholder, disabled } = props;
  return (
    <Input
      type="number"
      inputMode="numeric"
      className="w-24"
      placeholder={placeholder}
      value={value === null || value === undefined ? "" : String(value)}
      disabled={disabled}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "") {
          onChange(null);
          return;
        }
        const parsed = Number(raw);
        if (Number.isFinite(parsed) && Number.isInteger(parsed)) {
          onChange(parsed);
        } else {
          // Preserve the user's keystroke by writing the raw value as a string
          // is unsafe (the type is numeric); the safest behavior is to keep
          // the previous value rather than commit a non-integer.
          onChange(null);
        }
      }}
    />
  );
}
