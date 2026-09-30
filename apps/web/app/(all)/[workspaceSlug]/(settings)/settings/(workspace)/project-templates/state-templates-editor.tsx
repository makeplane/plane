/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Plus, Star, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/ui";
import type { TStateTemplateField, TStateTemplateGroup } from "./project-template-form.types";
import {
  STATE_GROUP_DEFAULT_COLOR,
  STATE_TEMPLATE_GROUPS,
  TEMPLATE_COLOR_PALETTE,
} from "./project-template-form.types";
import { ColorSwatchPicker } from "./shared/color-swatch-picker";

type TProps = {
  value: TStateTemplateField[];
  onChange: (next: TStateTemplateField[]) => void;
};

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

export const StateTemplatesEditor = ({ value, onChange }: TProps) => {
  const { t } = useTranslation();
  const [draftGroup, setDraftGroup] = useState<TStateTemplateGroup | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftColor, setDraftColor] = useState<string>(TEMPLATE_COLOR_PALETTE[0]);

  const startDraft = (group: TStateTemplateGroup) => {
    setDraftGroup(group);
    setDraftName("");
    setDraftColor(STATE_GROUP_DEFAULT_COLOR[group]);
  };

  const cancelDraft = () => {
    setDraftGroup(null);
    setDraftName("");
  };

  const onAdd = () => {
    if (!draftGroup || !draftName.trim()) return;
    const groupHasDefault = value.some((state) => state.group === draftGroup && state.default);
    onChange([
      ...value,
      {
        id: generateId(),
        name: draftName.trim(),
        group: draftGroup,
        color: draftColor,
        default: !groupHasDefault,
      },
    ]);
    cancelDraft();
  };

  const onDelete = (id: string) => {
    onChange(value.filter((state) => state.id !== id));
  };

  const onUpdate = (id: string, patch: Partial<TStateTemplateField>) => {
    onChange(value.map((state) => (state.id === id ? { ...state, ...patch } : state)));
  };

  const onMarkDefault = (id: string) => {
    const target = value.find((state) => state.id === id);
    if (!target) return;
    onChange(
      value.map((state) => {
        if (state.group !== target.group) return state;
        return { ...state, default: state.id === id };
      })
    );
  };

  return (
    <div className="space-y-3">
      {STATE_TEMPLATE_GROUPS.map((group) => {
        const groupStates = value.filter((state) => state.group === group);
        const isDrafting = draftGroup === group;
        return (
          <div key={group} className="rounded-md border border-subtle bg-surface-1">
            <div className="flex items-center justify-between border-b border-subtle px-3 py-2">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: STATE_GROUP_DEFAULT_COLOR[group] }}
                />
                <span className="text-13 font-medium text-primary capitalize">
                  {t(`workspace_settings.settings.project_templates.form.state_groups.${group}`)}
                </span>
                <span className="text-11 text-tertiary">({groupStates.length})</span>
              </div>
              {!isDrafting ? (
                <button
                  type="button"
                  className="flex items-center gap-1 text-12 font-medium text-secondary hover:text-primary"
                  onClick={() => startDraft(group)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("workspace_settings.settings.project_templates.form.add_state")}
                </button>
              ) : null}
            </div>
            <div className="divide-y divide-subtle">
              {groupStates.length === 0 && !isDrafting ? (
                <p className="px-3 py-2 text-12 text-tertiary">
                  {t("workspace_settings.settings.project_templates.form.states_group_empty")}
                </p>
              ) : null}
              {groupStates.map((state) => (
                <div key={state.id} className="flex items-center gap-2 px-3 py-2">
                  <ColorSwatchPicker
                    value={state.color}
                    onChange={(color) => onUpdate(state.id, { color })}
                    colors={TEMPLATE_COLOR_PALETTE}
                  />
                  <Input
                    className="h-8 flex-1"
                    value={state.name}
                    onChange={(event) => onUpdate(state.id, { name: event.target.value })}
                    placeholder={t("workspace_settings.settings.project_templates.form.state_name_placeholder")}
                  />
                  <button
                    type="button"
                    className={`rounded-md p-1 ${
                      state.default ? "text-warning-primary" : "text-tertiary hover:bg-surface-2 hover:text-primary"
                    }`}
                    onClick={() => onMarkDefault(state.id)}
                    aria-label={t("workspace_settings.settings.project_templates.form.mark_default_state")}
                    title={t("workspace_settings.settings.project_templates.form.mark_default_state")}
                  >
                    <Star className="h-4 w-4" fill={state.default ? "currentColor" : "transparent"} />
                  </button>
                  <button
                    type="button"
                    className="rounded-md p-1 text-tertiary hover:bg-surface-2 hover:text-danger-primary"
                    onClick={() => onDelete(state.id)}
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
                    placeholder={t("workspace_settings.settings.project_templates.form.state_name_placeholder")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        onAdd();
                      }
                      if (event.key === "Escape") {
                        event.preventDefault();
                        cancelDraft();
                      }
                    }}
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={cancelDraft}>
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
      })}
    </div>
  );
};
