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
import type { TProjectTemplateModuleStatus } from "@plane/types";
import { CustomSelect, Input } from "@plane/ui";
// local imports
import type { TProjectTemplateForm } from "../utils";
import { slugifyKey, uniqueKey } from "../utils";
import { Section } from "./section";

type TModulesSection = {
  control: Control<TProjectTemplateForm>;
  array: UseFieldArrayReturn<TProjectTemplateForm, "payload.modules">;
  disabled?: boolean;
  clientError?: string;
  backendError?: string;
};

const MODULE_STATUSES: TProjectTemplateModuleStatus[] = [
  "backlog",
  "planned",
  "in-progress",
  "paused",
  "completed",
  "cancelled",
];

const STATUS_LABELS: Record<TProjectTemplateModuleStatus, string> = {
  backlog: "Backlog",
  planned: "Planned",
  "in-progress": "In progress",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
};

/**
 * Modules section: inline add/edit/remove rows. No drag handle — module order
 * is not user-meaningful (D-11). Stable `module_key` is generated ONCE at
 * add-time and preserved across renames (D-12 / RESEARCH Pitfall 2).
 */
export const ModulesSection = observer(function ModulesSection(props: TModulesSection) {
  const { control, array, disabled, clientError, backendError } = props;
  const { fields, append, remove } = array;
  const { t } = useTranslation();

  const usedKeys = new Set(fields.map((m) => m.module_key));

  const handleAdd = () => {
    const base = slugifyKey(`module_${fields.length + 1}`);
    const newKey = uniqueKey(base, usedKeys);
    append({
      module_key: newKey,
      name: "",
      status: "backlog" as TProjectTemplateModuleStatus,
    });
  };

  const handleRemove = (idx: number) => {
    remove(idx);
  };

  return (
    <Section
      title={t("workspace_settings.settings.project_templates.editor.modules_section_title")}
      error={backendError ?? clientError}
      action={
        !disabled && (
          <Button variant="secondary" size="sm" onClick={handleAdd} prependIcon={<Plus className="size-3" />}>
            {t("workspace_settings.settings.project_templates.editor.add_module")}
          </Button>
        )
      }
    >
      {fields.length === 0 ? (
        <p className="text-body-xs-regular text-tertiary">
          {t("workspace_settings.settings.project_templates.editor.modules_empty_hint")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {fields.map((row, idx) => (
            <div key={row.id} className="flex items-center gap-3 rounded-md border border-subtle bg-layer-1 px-3 py-2">
              {/* Name */}
              <Controller
                name={`payload.modules.${idx}.name`}
                control={control}
                rules={{ required: true, maxLength: 255 }}
                render={({ field, fieldState: { error } }) => (
                  <div className="flex flex-1 flex-col">
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      hasError={Boolean(error)}
                      placeholder={t("workspace_settings.settings.project_templates.editor.module_name_placeholder")}
                      disabled={disabled}
                    />
                  </div>
                )}
              />

              {/* Status */}
              <Controller
                name={`payload.modules.${idx}.status`}
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value}
                    label={STATUS_LABELS[field.value as TProjectTemplateModuleStatus] ?? field.value}
                    onChange={(v: TProjectTemplateModuleStatus) => field.onChange(v)}
                    disabled={disabled}
                    input
                  >
                    {MODULE_STATUSES.map((s) => (
                      <CustomSelect.Option key={s} value={s}>
                        {STATUS_LABELS[s]}
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
                  onClick={() => handleRemove(idx)}
                  aria-label={t("workspace_settings.settings.project_templates.editor.remove")}
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
});
