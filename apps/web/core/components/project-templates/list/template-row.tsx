/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import type { TProjectTemplate } from "@plane/types";
import { useTranslation } from "@plane/i18n";
// helpers
import { cn } from "@plane/utils";

type TProjectTemplateRow = {
  template: TProjectTemplate;
};

export const ProjectTemplateRow = observer(function ProjectTemplateRow(props: TProjectTemplateRow) {
  const { template } = props;
  // translation
  const { t } = useTranslation();

  // Provenance: built-in rows are read-only. Provenance is conveyed by the
  // parent section heading, NOT row tint — per UI-SPEC Color contract.
  const isBuiltIn = template.is_system;
  const isInactive = !template.is_active;

  // Build a counts caption from the payload section lengths. Falls back to the
  // template description if no counts are available.
  const counts = template.payload;
  const countParts: string[] = [];
  if (counts) {
    const statesCount = counts.states?.length ?? 0;
    const labelsCount = counts.labels?.length ?? 0;
    const modulesCount = counts.modules?.length ?? 0;
    const cyclesCount = counts.cycles?.length ?? 0;
    const starterIssuesCount = counts.starter_issues?.length ?? 0;

    if (statesCount > 0)
      countParts.push(t("workspace_settings.settings.project_templates.counts.states", { count: statesCount }));
    if (labelsCount > 0)
      countParts.push(t("workspace_settings.settings.project_templates.counts.labels", { count: labelsCount }));
    if (modulesCount > 0)
      countParts.push(t("workspace_settings.settings.project_templates.counts.modules", { count: modulesCount }));
    if (cyclesCount > 0)
      countParts.push(t("workspace_settings.settings.project_templates.counts.cycles", { count: cyclesCount }));
    if (starterIssuesCount > 0)
      countParts.push(
        t("workspace_settings.settings.project_templates.counts.starter_issues", { count: starterIssuesCount })
      );
  }

  const caption = countParts.length > 0 ? countParts.join(" · ") : (template.description ?? "");

  return (
    <div
      className={cn("group rounded-lg border border-subtle bg-layer-2 px-4 py-3", {
        "opacity-70": isInactive,
      })}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h5
            className={cn("truncate text-body-sm-medium", {
              "text-primary": !isBuiltIn || !isInactive,
              "text-tertiary": isBuiltIn,
            })}
          >
            {template.name}
          </h5>
          {caption && (
            <p className={cn("truncate text-body-xs-regular", isBuiltIn ? "text-tertiary" : "text-tertiary")}>
              {caption}
            </p>
          )}
        </div>
        {/* Right-aligned action slot — placeholder in this plan.
            Full Edit/Duplicate/Deactivate/Reactivate wiring lands in Plan 05. */}
        <div className="shrink-0" />
      </div>
    </div>
  );
});
