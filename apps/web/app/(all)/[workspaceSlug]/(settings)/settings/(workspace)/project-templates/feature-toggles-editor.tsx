/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Calendar, FileText, Inbox, Layers, ListChecks, Tags, Timer } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { ToggleSwitch } from "@plane/ui";
import type { TProjectTemplateFeatureToggles } from "./project-template-form.types";

type TProps = {
  value: TProjectTemplateFeatureToggles;
  onChange: (next: TProjectTemplateFeatureToggles) => void;
};

type TFeatureItem = {
  key: keyof TProjectTemplateFeatureToggles;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  descriptionKey: string;
};

const FEATURES: TFeatureItem[] = [
  {
    key: "cycle_view",
    icon: Calendar,
    labelKey: "workspace_settings.settings.project_templates.form.features.cycles.label",
    descriptionKey: "workspace_settings.settings.project_templates.form.features.cycles.description",
  },
  {
    key: "module_view",
    icon: Layers,
    labelKey: "workspace_settings.settings.project_templates.form.features.modules.label",
    descriptionKey: "workspace_settings.settings.project_templates.form.features.modules.description",
  },
  {
    key: "issue_views_view",
    icon: ListChecks,
    labelKey: "workspace_settings.settings.project_templates.form.features.views.label",
    descriptionKey: "workspace_settings.settings.project_templates.form.features.views.description",
  },
  {
    key: "page_view",
    icon: FileText,
    labelKey: "workspace_settings.settings.project_templates.form.features.pages.label",
    descriptionKey: "workspace_settings.settings.project_templates.form.features.pages.description",
  },
  {
    key: "intake_view",
    icon: Inbox,
    labelKey: "workspace_settings.settings.project_templates.form.features.intake.label",
    descriptionKey: "workspace_settings.settings.project_templates.form.features.intake.description",
  },
  {
    key: "is_time_tracking_enabled",
    icon: Timer,
    labelKey: "workspace_settings.settings.project_templates.form.features.time_tracking.label",
    descriptionKey: "workspace_settings.settings.project_templates.form.features.time_tracking.description",
  },
  {
    key: "is_issue_type_enabled",
    icon: Tags,
    labelKey: "workspace_settings.settings.project_templates.form.features.work_item_types.label",
    descriptionKey: "workspace_settings.settings.project_templates.form.features.work_item_types.description",
  },
];

export const FeatureTogglesEditor = ({ value, onChange }: TProps) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-md border border-subtle bg-surface-1">
      <ul className="divide-y divide-subtle">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <li key={feature.key} className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-surface-2">
                  <Icon className="h-4 w-4 text-secondary" />
                </span>
                <div>
                  <p className="text-13 font-medium text-primary">{t(feature.labelKey)}</p>
                  <p className="text-12 text-tertiary">{t(feature.descriptionKey)}</p>
                </div>
              </div>
              <ToggleSwitch
                value={value[feature.key]}
                onChange={(next) => onChange({ ...value, [feature.key]: next })}
                size="sm"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};
