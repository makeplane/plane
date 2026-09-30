/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Controller, useFormContext } from "react-hook-form";
import { Calendar, FileText, Inbox, Layers, ListChecks, Tags, Timer } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { ToggleSwitch } from "@plane/ui";
import type { IProject } from "@plane/types";

type TFeatureKey = keyof Pick<
  IProject,
  | "cycle_view"
  | "module_view"
  | "issue_views_view"
  | "page_view"
  | "inbox_view"
  | "is_time_tracking_enabled"
  | "is_issue_type_enabled"
>;

type TFeatureItem = {
  key: TFeatureKey;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  descriptionKey: string;
};

const FEATURES: TFeatureItem[] = [
  {
    key: "cycle_view",
    icon: Calendar,
    labelKey: "project_create.features.cycles.label",
    descriptionKey: "project_create.features.cycles.description",
  },
  {
    key: "module_view",
    icon: Layers,
    labelKey: "project_create.features.modules.label",
    descriptionKey: "project_create.features.modules.description",
  },
  {
    key: "issue_views_view",
    icon: ListChecks,
    labelKey: "project_create.features.views.label",
    descriptionKey: "project_create.features.views.description",
  },
  {
    key: "page_view",
    icon: FileText,
    labelKey: "project_create.features.pages.label",
    descriptionKey: "project_create.features.pages.description",
  },
  {
    key: "inbox_view",
    icon: Inbox,
    labelKey: "project_create.features.intake.label",
    descriptionKey: "project_create.features.intake.description",
  },
  {
    key: "is_time_tracking_enabled",
    icon: Timer,
    labelKey: "project_create.features.time_tracking.label",
    descriptionKey: "project_create.features.time_tracking.description",
  },
  {
    key: "is_issue_type_enabled",
    icon: Tags,
    labelKey: "project_create.features.work_item_types.label",
    descriptionKey: "project_create.features.work_item_types.description",
  },
];

export function ProjectCreateFeatureToggles() {
  const { t } = useTranslation();
  const { control } = useFormContext<IProject>();

  return (
    <div className="rounded-md border border-subtle bg-surface-1">
      <div className="border-b border-subtle px-3 py-2.5">
        <p className="text-13 font-medium text-primary">{t("project_create.features.title")}</p>
        <p className="text-12 text-tertiary">{t("project_create.features.description")}</p>
      </div>
      <ul className="divide-y divide-subtle">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <li key={feature.key} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-surface-2">
                  <Icon className="h-4 w-4 text-secondary" />
                </span>
                <div className="min-w-0">
                  <p className="text-13 font-medium text-primary">{t(feature.labelKey)}</p>
                  <p className="text-12 text-tertiary">{t(feature.descriptionKey)}</p>
                </div>
              </div>
              <Controller
                name={feature.key}
                control={control}
                render={({ field: { value, onChange } }) => (
                  <ToggleSwitch value={Boolean(value)} onChange={onChange} size="sm" />
                )}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
