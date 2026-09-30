/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/ui";
import type { TLabelTemplateField } from "./project-template-form.types";
import { TEMPLATE_COLOR_PALETTE } from "./project-template-form.types";
import { ColorSwatchPicker } from "./shared/color-swatch-picker";

type TProps = {
  value: TLabelTemplateField[];
  onChange: (next: TLabelTemplateField[]) => void;
};

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

export const LabelTemplatesEditor = ({ value, onChange }: TProps) => {
  const { t } = useTranslation();
  const [draftName, setDraftName] = useState("");
  const [draftColor, setDraftColor] = useState<string>(TEMPLATE_COLOR_PALETTE[0]);
  const [isDrafting, setIsDrafting] = useState(false);

  const reset = () => {
    setDraftName("");
    setDraftColor(TEMPLATE_COLOR_PALETTE[0]);
    setIsDrafting(false);
  };

  const onAdd = () => {
    if (!draftName.trim()) return;
    onChange([
      ...value,
      {
        id: generateId(),
        name: draftName.trim(),
        color: draftColor,
      },
    ]);
    reset();
  };

  const onDelete = (id: string) => {
    onChange(value.filter((label) => label.id !== id));
  };

  const onUpdate = (id: string, patch: Partial<TLabelTemplateField>) => {
    onChange(value.map((label) => (label.id === id ? { ...label, ...patch } : label)));
  };

  return (
    <div className="rounded-md border border-subtle bg-surface-1">
      <div className="flex items-center justify-between border-b border-subtle px-3 py-2">
        <span className="text-13 font-medium text-primary">
          {t("workspace_settings.settings.project_templates.form.default_labels")}
        </span>
        {!isDrafting ? (
          <button
            type="button"
            className="flex items-center gap-1 text-12 font-medium text-secondary hover:text-primary"
            onClick={() => setIsDrafting(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            {t("workspace_settings.settings.project_templates.form.add_label")}
          </button>
        ) : null}
      </div>
      <div className="divide-y divide-subtle">
        {value.length === 0 && !isDrafting ? (
          <p className="px-3 py-3 text-12 text-tertiary">
            {t("workspace_settings.settings.project_templates.form.labels_empty")}
          </p>
        ) : null}
        {value.map((label) => (
          <div key={label.id} className="flex items-center gap-2 px-3 py-2">
            <ColorSwatchPicker
              value={label.color}
              onChange={(color) => onUpdate(label.id, { color })}
              colors={TEMPLATE_COLOR_PALETTE}
            />
            <Input
              className="h-8 flex-1"
              value={label.name}
              onChange={(event) => onUpdate(label.id, { name: event.target.value })}
              placeholder={t("workspace_settings.settings.project_templates.form.label_name_placeholder")}
            />
            <button
              type="button"
              className="rounded-md p-1 text-tertiary hover:bg-surface-2 hover:text-danger-primary"
              onClick={() => onDelete(label.id)}
              aria-label={t("remove")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {isDrafting ? (
          <div className="flex items-center gap-2 px-3 py-2">
            <ColorSwatchPicker value={draftColor} onChange={setDraftColor} colors={TEMPLATE_COLOR_PALETTE} />
            <Input
              className="h-8 flex-1"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder={t("workspace_settings.settings.project_templates.form.label_name_placeholder")}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onAdd();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  reset();
                }
              }}
            />
            <Button type="button" variant="secondary" size="sm" onClick={reset}>
              {t("cancel")}
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={onAdd} disabled={!draftName.trim()}>
              {t("add")}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
