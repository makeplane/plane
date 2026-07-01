/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { Control, UseFieldArrayReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import { GripVertical, Plus, Trash2 } from "lucide-react";
// plane imports
import { getRandomLabelColor } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TProjectTemplateStateGroup } from "@plane/types";
import { ColorPicker, CustomSelect, Input, Sortable } from "@plane/ui";
// local imports
import type { TProjectTemplateForm } from "../utils";
import { slugifyKey, uniqueKey } from "../utils";
import { Section } from "./section";

type TStatesSection = {
  control: Control<TProjectTemplateForm>;
  array: UseFieldArrayReturn<TProjectTemplateForm, "payload.states">;
  disabled?: boolean;
  clientError?: string;
  backendError?: string;
};

const STATE_GROUPS: TProjectTemplateStateGroup[] = [
  "backlog",
  "unstarted",
  "started",
  "completed",
  "cancelled",
  "triage",
];

const GROUP_LABELS: Record<TProjectTemplateStateGroup, string> = {
  backlog: "Backlog",
  unstarted: "Unstarted",
  started: "Started",
  completed: "Completed",
  cancelled: "Cancelled",
  triage: "Triage",
};

/**
 * States section: inline add/edit/remove rows + drag reorder + exactly-one
 * default enforcement. Stable `state_key` is generated ONCE at add-time and
 * preserved across renames so references don't dangle (D-12 / RESEARCH Pitfall 2).
 */
export const StatesSection = observer(function StatesSection(props: TStatesSection) {
  const { control, array, disabled, clientError, backendError } = props;
  const { fields, append, remove, move, update } = array;
  const { t } = useTranslation();

  const usedKeys = new Set(fields.map((s) => s.state_key));

  const handleAdd = () => {
    const base = slugifyKey(`state_${fields.length + 1}`);
    const newKey = uniqueKey(base, usedKeys);
    append({
      state_key: newKey,
      name: "",
      color: getRandomLabelColor(),
      group: "backlog" as TProjectTemplateStateGroup,
      default: fields.length === 0,
    });
  };

  const handleReorder = (newOrder: typeof fields) => {
    // Map the new ordering back to useFieldArray.move. We only act when the
    // order actually changed to avoid extra renders.
    const previousIds = fields.map((f) => f.id);
    const newIds = newOrder.map((o) => o.id);
    for (let toIndex = 0; toIndex < newIds.length; toIndex++) {
      const id = newIds[toIndex];
      const fromIndex = previousIds.indexOf(id);
      if (fromIndex !== -1 && fromIndex !== toIndex) move(fromIndex, toIndex);
    }
  };

  const handleSetDefault = (selectedId: string, targetDefault: boolean) => {
    // Exactly-one-default (RESEARCH Pitfall 3): enforce by clearing all others
    // and reapplying the new selection.
    fields.forEach((row, idx) => {
      const targetIsSelected = row.id === selectedId;
      const newDefault = targetIsSelected ? targetDefault : false;
      if (row.default !== newDefault) {
        update(idx, { ...row, default: newDefault });
      }
    });
  };

  const handleRemove = (idx: number) => {
    remove(idx);
  };

  return (
    <Section
      title={t("workspace_settings.settings.project_templates.editor.states_section_title")}
      error={backendError ?? clientError}
      action={
        !disabled && (
          <Button variant="secondary" size="sm" onClick={handleAdd} prependIcon={<Plus className="size-3" />}>
            {t("workspace_settings.settings.project_templates.editor.add_state")}
          </Button>
        )
      }
    >
      {fields.length === 0 ? (
        <p className="text-body-xs-regular text-tertiary">
          {t("workspace_settings.settings.project_templates.editor.states_empty_hint")}
        </p>
      ) : (
        <Sortable
          data={fields}
          keyExtractor={(row: (typeof fields)[number], idx) => row.id ?? String(idx)}
          onChange={handleReorder}
          containerClassName=""
          render={(row, idx) => (
            <div key={row.id} className="flex items-center gap-3 rounded-md border border-subtle bg-layer-1 px-3 py-2">
              {!disabled && fields.length > 1 && (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center text-secondary">
                  <GripVertical className="size-3" />
                </div>
              )}

              {/* Color */}
              <Controller
                name={`payload.states.${idx}.color`}
                control={control}
                render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
              />

              {/* Name */}
              <Controller
                name={`payload.states.${idx}.name`}
                control={control}
                rules={{ required: true }}
                render={({ field, fieldState: { error } }) => (
                  <div className="flex flex-1 flex-col">
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      hasError={Boolean(error)}
                      placeholder={t("workspace_settings.settings.project_templates.editor.state_name_placeholder")}
                      disabled={disabled}
                    />
                  </div>
                )}
              />

              {/* Group */}
              <Controller
                name={`payload.states.${idx}.group`}
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value}
                    label={GROUP_LABELS[field.value as TProjectTemplateStateGroup] ?? field.value}
                    onChange={(v: TProjectTemplateStateGroup) => field.onChange(v)}
                    disabled={disabled}
                    input
                  >
                    {STATE_GROUPS.map((g) => (
                      <CustomSelect.Option key={g} value={g}>
                        {GROUP_LABELS[g]}
                      </CustomSelect.Option>
                    ))}
                  </CustomSelect>
                )}
              />

              {/* Default marker */}
              <Controller
                name={`payload.states.${idx}.default`}
                control={control}
                render={({ field }) => (
                  <label className="flex shrink-0 cursor-pointer items-center gap-1 text-body-xs-regular">
                    <input
                      type="radio"
                      checked={field.value === true}
                      onChange={() => handleSetDefault(row.id, true)}
                      disabled={disabled}
                      aria-label={t("workspace_settings.settings.project_templates.editor.default_marker")}
                      className="accent-accent-primary size-3.5"
                    />
                    <span className={field.value ? "text-accent-primary" : "text-secondary"}>
                      {t("workspace_settings.settings.project_templates.editor.default_marker")}
                    </span>
                  </label>
                )}
              />

              {/* Remove */}
              {!disabled && (
                <button
                  type="button"
                  className="flex size-6 shrink-0 items-center justify-center rounded-sm text-tertiary transition-colors hover:bg-layer-2 hover:text-danger-primary"
                  onClick={() => handleRemove(idx)}
                  aria-label={t("workspace_settings.settings.project_templates.editor.remove")}
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          )}
        />
      )}
    </Section>
  );
});
