/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
// plane imports
import type { TProjectTemplate } from "@plane/types";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// ui
import { CustomMenu } from "@plane/ui";
// components
import { ProjectService } from "@/services/project";
// helpers
import { cn } from "@plane/utils";

type TProjectTemplateRow = {
  template: TProjectTemplate;
  onDeactivate?: (template: TProjectTemplate) => void;
};

const projectService = new ProjectService();

export const ProjectTemplateRow = observer(function ProjectTemplateRow(props: TProjectTemplateRow) {
  const { template, onDeactivate } = props;
  // translation
  const { t } = useTranslation();
  // router
  const router = useRouter();
  const { workspaceSlug } = useParams();

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

  // ---- Action handlers -------------------------------------------------

  const handleEdit = () => {
    if (!workspaceSlug) return;
    router.push(`/${workspaceSlug}/settings/templates/${template.id}/edit`);
  };

  const handleView = () => {
    // Built-in rows navigate to the same edit route; the edit page renders
    // read-only when is_system is true (per 04-03 summary).
    if (!workspaceSlug) return;
    router.push(`/${workspaceSlug}/settings/templates/${template.id}/edit`);
  };

  const handleDuplicate = async () => {
    if (!workspaceSlug) return;
    await projectService
      .duplicateProjectTemplate(workspaceSlug.toString(), template.id)
      // eslint-disable-next-line promise/always-return
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("workspace_settings.settings.project_templates.toast.duplicated_title"),
          message: t("workspace_settings.settings.project_templates.toast.duplicated_message"),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("workspace_settings.settings.project_templates.toast.error_title"),
          message: t("workspace_settings.settings.project_templates.toast.duplicate_error"),
        });
      });
  };

  const handleReactivate = async () => {
    if (!workspaceSlug) return;
    await projectService
      .reactivateProjectTemplate(workspaceSlug.toString(), template.id)
      // eslint-disable-next-line promise/always-return
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("workspace_settings.settings.project_templates.toast.reactivated_title"),
          message: t("workspace_settings.settings.project_templates.toast.reactivated_message"),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("workspace_settings.settings.project_templates.toast.error_title"),
          message: t("workspace_settings.settings.project_templates.toast.reactivate_error"),
        });
      });
  };

  // The deactivate action is delegated to the parent (which owns the SWR
  // mutate function for the include-inactive key). Custom rows expose it
  // through the overflow (⋮) menu — built-in rows never get here.
  const handleDeactivate = () => {
    onDeactivate?.(template);
  };

  // ---- Action affordances per D-07/D-08 matrix --------------------------
  //
  // custom + active:    Edit · Duplicate + (⋮ Deactivate)
  // custom + inactive:  Reactivate + (⋮ Edit · Duplicate)
  // built-in:           Duplicate · View (read-only)

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
              "text-primary": !isBuiltIn && !isInactive,
              "text-tertiary": isBuiltIn || isInactive,
            })}
          >
            {template.name}
          </h5>
          {caption && <p className="truncate text-body-xs-regular text-tertiary">{caption}</p>}
        </div>

        {/* Right-aligned action slot — Edit / Duplicate / View / Reactivate / (⋮). */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Built-in rows: Duplicate + View (read-only via the same edit route). */}
          {isBuiltIn && (
            <>
              <button
                type="button"
                className="rounded-sm px-2 py-1 text-body-xs-medium text-secondary transition-colors hover:bg-layer-1 hover:text-primary"
                onClick={handleDuplicate}
              >
                {t("workspace_settings.settings.project_templates.row.duplicate")}
              </button>
              <button
                type="button"
                className="rounded-sm px-2 py-1 text-body-xs-medium text-secondary transition-colors hover:bg-layer-1 hover:text-primary"
                onClick={handleView}
              >
                {t("workspace_settings.settings.project_templates.row.view")}
              </button>
            </>
          )}

          {/* Custom + active: Edit + Duplicate as primary actions. */}
          {!isBuiltIn && !isInactive && (
            <>
              <button
                type="button"
                className="rounded-sm px-2 py-1 text-body-xs-medium text-secondary transition-colors hover:bg-layer-1 hover:text-primary"
                onClick={handleEdit}
              >
                {t("workspace_settings.settings.project_templates.row.edit")}
              </button>
              <button
                type="button"
                className="rounded-sm px-2 py-1 text-body-xs-medium text-secondary transition-colors hover:bg-layer-1 hover:text-primary"
                onClick={handleDuplicate}
              >
                {t("workspace_settings.settings.project_templates.row.duplicate")}
              </button>
              <CustomMenu ellipsis>
                <CustomMenu.MenuItem onClick={handleDeactivate}>
                  <span className="text-danger-primary">
                    {t("workspace_settings.settings.project_templates.row.deactivate")}
                  </span>
                </CustomMenu.MenuItem>
              </CustomMenu>
            </>
          )}

          {/* Custom + inactive (only shown when Show-deactivated is on): Reactivate primary + (⋮ Edit/Duplicate). */}
          {!isBuiltIn && isInactive && (
            <>
              <button
                type="button"
                className="rounded-sm px-2 py-1 text-body-xs-medium text-accent-primary transition-colors hover:bg-layer-1"
                onClick={handleReactivate}
              >
                {t("workspace_settings.settings.project_templates.row.reactivate")}
              </button>
              <CustomMenu ellipsis>
                <CustomMenu.MenuItem onClick={handleEdit}>
                  {t("workspace_settings.settings.project_templates.row.edit")}
                </CustomMenu.MenuItem>
                <CustomMenu.MenuItem onClick={handleDuplicate}>
                  {t("workspace_settings.settings.project_templates.row.duplicate")}
                </CustomMenu.MenuItem>
              </CustomMenu>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
