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
import { ColorPicker, Input, Sortable } from "@plane/ui";
// local imports
import type { TProjectTemplateForm } from "../utils";
import { slugifyKey, uniqueKey } from "../utils";
import { Section } from "./section";

type TLabelsSection = {
  control: Control<TProjectTemplateForm>;
  array: UseFieldArrayReturn<TProjectTemplateForm, "payload.labels">;
  disabled?: boolean;
  clientError?: string;
  backendError?: string;
};

/**
 * Labels section: inline add/edit/remove rows + drag reorder.
 * Stable `label_key` is generated ONCE at add-time and preserved across
 * renames (D-12 / RESEARCH Pitfall 2).
 */
export const LabelsSection = observer(function LabelsSection(props: TLabelsSection) {
  const { control, array, disabled, clientError, backendError } = props;
  const { fields, append, remove, move } = array;
  const { t } = useTranslation();

  const usedKeys = new Set(fields.map((l) => l.label_key));

  const handleAdd = () => {
    const base = slugifyKey(`label_${fields.length + 1}`);
    const newKey = uniqueKey(base, usedKeys);
    append({
      label_key: newKey,
      name: "",
      color: getRandomLabelColor(),
    });
  };

  const handleReorder = (newOrder: typeof fields) => {
    const previousIds = fields.map((f) => f.id);
    const newIds = newOrder.map((o) => o.id);
    for (let toIndex = 0; toIndex < newIds.length; toIndex++) {
      const id = newIds[toIndex];
      const fromIndex = previousIds.indexOf(id);
      if (fromIndex !== -1 && fromIndex !== toIndex) move(fromIndex, toIndex);
    }
  };

  const handleRemove = (idx: number) => {
    remove(idx);
  };

  return (
    <Section
      title={t("workspace_settings.settings.project_templates.editor.labels_section_title")}
      error={backendError ?? clientError}
      action={
        !disabled && (
          <Button variant="secondary" size="sm" onClick={handleAdd} prependIcon={<Plus className="size-3" />}>
            {t("workspace_settings.settings.project_templates.editor.add_label")}
          </Button>
        )
      }
    >
      {fields.length === 0 ? (
        <p className="text-body-xs-regular text-tertiary">
          {t("workspace_settings.settings.project_templates.editor.labels_empty_hint")}
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

              <Controller
                name={`payload.labels.${idx}.color`}
                control={control}
                render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
              />

              <Controller
                name={`payload.labels.${idx}.name`}
                control={control}
                rules={{ required: true }}
                render={({ field, fieldState: { error } }) => (
                  <div className="flex flex-1 flex-col">
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      hasError={Boolean(error)}
                      placeholder={t("workspace_settings.settings.project_templates.editor.label_name_placeholder")}
                      disabled={disabled}
                    />
                  </div>
                )}
              />

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
