/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { EPillVariant, Pill, EPillSize } from "@plane/propel/pill";
import { Input, TextArea, ToggleSwitch } from "@plane/ui";
import { CustomPropertiesTemplateEditor } from "./custom-properties-template-editor";
import type { TAdditionalWorkItemTypeTemplate, TCustomPropertyTemplateField } from "./project-template-form.types";

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

type TProps = {
  enabled: boolean;
  epicEnabled: boolean;
  onEpicEnabledChange: (value: boolean) => void;
  taskCustomProperties: TCustomPropertyTemplateField[];
  epicCustomProperties: TCustomPropertyTemplateField[];
  additionalWorkItemTypes: TAdditionalWorkItemTypeTemplate[];
  onChangeTask: (next: TCustomPropertyTemplateField[]) => void;
  onChangeEpic: (next: TCustomPropertyTemplateField[]) => void;
  onChangeAdditional: (next: TAdditionalWorkItemTypeTemplate[]) => void;
};

export const WorkItemTypesTemplateEditor = ({
  enabled,
  epicEnabled,
  onEpicEnabledChange,
  taskCustomProperties,
  epicCustomProperties,
  additionalWorkItemTypes,
  onChangeTask,
  onChangeEpic,
  onChangeAdditional,
}: TProps) => {
  const { t } = useTranslation();

  const addWorkItemType = () => {
    onChangeAdditional([
      ...additionalWorkItemTypes,
      {
        id: generateId(),
        name: "",
        description: "",
        customProperties: [],
      },
    ]);
  };

  const removeWorkItemType = (id: string) => {
    onChangeAdditional(additionalWorkItemTypes.filter((row) => row.id !== id));
  };

  const patchWorkItemType = (id: string, patch: Partial<TAdditionalWorkItemTypeTemplate>) => {
    onChangeAdditional(additionalWorkItemTypes.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  if (!enabled) {
    return (
      <div className="rounded-md border border-dashed border-subtle bg-surface-1 px-4 py-6 text-center">
        <p className="text-13 text-tertiary">
          {t("workspace_settings.settings.project_templates.form.work_item_types.disabled_hint")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-subtle bg-surface-1">
        <div className="flex flex-wrap items-center gap-2 border-b border-subtle px-3 py-2">
          <span className="text-13 font-medium text-primary">
            {t("workspace_settings.settings.project_templates.form.work_item_types.task.title")}
          </span>
          <Pill variant={EPillVariant.PRIMARY} size={EPillSize.SM} className="rounded-md border-none">
            {t("workspace_settings.settings.project_templates.form.work_item_types.default_badge")}
          </Pill>
        </div>
        <div className="space-y-2 px-3 py-3">
          <p className="text-12 text-secondary">
            {t("workspace_settings.settings.project_templates.form.work_item_types.task.description")}
          </p>
          <CustomPropertiesTemplateEditor
            properties={taskCustomProperties}
            onChange={onChangeTask}
            emptyHint={t("workspace_settings.settings.project_templates.form.work_item_types.properties_empty")}
          />
        </div>
      </div>

      <div className="rounded-md border border-subtle bg-surface-1">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-13 font-medium text-primary">
              {t("workspace_settings.settings.project_templates.form.work_item_types.epic.title")}
            </span>
            <Pill variant={EPillVariant.DEFAULT} size={EPillSize.SM} className="rounded-md border-none">
              {t("workspace_settings.settings.project_templates.form.work_item_types.optional_badge")}
            </Pill>
          </div>
          <ToggleSwitch value={epicEnabled} onChange={onEpicEnabledChange} size="sm" />
        </div>
        {epicEnabled ? (
          <div className="space-y-2 px-3 py-3">
            <p className="text-12 text-secondary">
              {t("workspace_settings.settings.project_templates.form.work_item_types.epic.description")}
            </p>
            <CustomPropertiesTemplateEditor
              properties={epicCustomProperties}
              onChange={onChangeEpic}
              emptyHint={t("workspace_settings.settings.project_templates.form.work_item_types.properties_empty")}
            />
          </div>
        ) : (
          <p className="px-3 py-3 text-12 text-tertiary">
            {t("workspace_settings.settings.project_templates.form.work_item_types.epic.disabled")}
          </p>
        )}
      </div>

      <div className="rounded-md border border-subtle bg-surface-1">
        <div className="flex flex-wrap items-center gap-2 border-b border-subtle px-3 py-2">
          <span className="text-13 font-medium text-primary">
            {t("workspace_settings.settings.project_templates.form.work_item_types.additional_section.title")}
          </span>
          <Pill variant={EPillVariant.DEFAULT} size={EPillSize.SM} className="rounded-md border-none">
            {t("workspace_settings.settings.project_templates.form.work_item_types.optional_badge")}
          </Pill>
        </div>
        <div className="space-y-3 px-3 py-3">
          <p className="text-12 text-secondary">
            {t("workspace_settings.settings.project_templates.form.work_item_types.additional_section.description")}
          </p>
          {additionalWorkItemTypes.length === 0 ? (
            <p className="text-12 text-tertiary">
              {t("workspace_settings.settings.project_templates.form.work_item_types.additional_section.empty")}
            </p>
          ) : null}
          {additionalWorkItemTypes.map((row) => (
            <AdditionalWorkItemTypeCard
              key={row.id}
              row={row}
              onPatch={(patch) => patchWorkItemType(row.id, patch)}
              onRemove={() => removeWorkItemType(row.id)}
            />
          ))}
          <button
            type="button"
            className="flex items-center gap-1 text-12 font-medium text-secondary hover:text-primary"
            onClick={addWorkItemType}
          >
            <Plus className="h-3.5 w-3.5" />
            {t("workspace_settings.settings.project_templates.form.work_item_types.additional_section.add_type")}
          </button>
        </div>
      </div>
    </div>
  );
};

function AdditionalWorkItemTypeCard(props: {
  row: TAdditionalWorkItemTypeTemplate;
  onPatch: (patch: Partial<TAdditionalWorkItemTypeTemplate>) => void;
  onRemove: () => void;
}) {
  const { row, onPatch, onRemove } = props;
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-md border border-subtle bg-surface-2">
      <div className="flex items-start gap-2 border-b border-subtle px-3 py-2">
        <button
          type="button"
          className="mt-0.5 rounded p-0.5 text-tertiary hover:bg-surface-1 hover:text-primary"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <Input
            className="h-8 w-full"
            value={row.name}
            onChange={(e) => onPatch({ name: e.target.value })}
            placeholder={t("workspace_settings.settings.project_templates.form.work_item_types.type_name_placeholder")}
          />
          {expanded ? (
            <TextArea
              className="min-h-[56px] w-full resize-y text-13"
              rows={2}
              value={row.description}
              onChange={(e) => onPatch({ description: e.target.value })}
              placeholder={t(
                "workspace_settings.settings.project_templates.form.work_item_types.type_description_placeholder"
              )}
            />
          ) : null}
        </div>
        <button
          type="button"
          className="rounded-md p-1 text-tertiary hover:bg-surface-1 hover:text-danger-primary"
          onClick={onRemove}
          aria-label={t("remove")}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {expanded ? (
        <div className="px-3 pt-2 pb-3">
          <CustomPropertiesTemplateEditor
            properties={row.customProperties}
            onChange={(next) => onPatch({ customProperties: next })}
            emptyHint={t("workspace_settings.settings.project_templates.form.work_item_types.properties_empty")}
          />
        </div>
      ) : null}
    </div>
  );
}
