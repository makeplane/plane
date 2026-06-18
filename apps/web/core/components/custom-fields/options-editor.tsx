/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { GripVertical, Plus, X } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TCustomFieldOption } from "@plane/types";
import { Input } from "@plane/ui";

type Props = {
  options: TCustomFieldOption[];
  onChange: (options: TCustomFieldOption[]) => void;
  hasError?: boolean;
};

const generateOptionId = () => `opt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export function OptionsEditor({ options, onChange, hasError }: Props) {
  const { t } = useTranslation();

  const updateOption = (id: string, patch: Partial<TCustomFieldOption>) =>
    onChange(options.map((option) => (option.id === id ? { ...option, ...patch } : option)));

  const removeOption = (id: string) => onChange(options.filter((option) => option.id !== id));

  const addOption = () => onChange([...options, { id: generateOptionId(), label: "", color: "#3f76ff" }]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-body-sm-medium text-secondary">
          {t("workspace_settings.settings.custom_fields.form.options")}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {options.map((option) => (
          <div key={option.id} className="flex items-center gap-2">
            <GripVertical className="size-4 shrink-0 text-placeholder" />
            <input
              type="color"
              value={option.color || "#3f76ff"}
              onChange={(e) => updateOption(option.id, { color: e.target.value })}
              className="size-7 shrink-0 cursor-pointer rounded-md border border-strong bg-surface-1"
            />
            <Input
              type="text"
              value={option.label}
              onChange={(e) => updateOption(option.id, { label: e.target.value })}
              placeholder={t("workspace_settings.settings.custom_fields.form.option_label")}
              hasError={hasError && !option.label.trim()}
              className="w-full text-body-sm-regular"
            />
            <button
              type="button"
              onClick={() => removeOption(option.id)}
              className="grid size-7 shrink-0 place-items-center rounded-md text-tertiary hover:bg-layer-1 hover:text-danger-primary"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <div>
        <Button variant="ghost" size="sm" prependIcon={<Plus className="size-3.5" />} onClick={addOption}>
          {t("workspace_settings.settings.custom_fields.form.add_option")}
        </Button>
      </div>
      {hasError && (
        <span className="text-11 text-danger-primary">
          {t("workspace_settings.settings.custom_fields.form.options_required")}
        </span>
      )}
    </div>
  );
}
