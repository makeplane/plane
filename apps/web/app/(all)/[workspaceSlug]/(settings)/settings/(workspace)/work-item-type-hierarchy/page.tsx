/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { ArrowUpRight, TriangleAlert } from "lucide-react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setPromiseToast } from "@plane/propel/toast";
import { Switch } from "@plane/propel/switch";
import { EUserWorkspaceRoles } from "@plane/types";
import { Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
// component
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
// plane web imports
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { TeamspaceUpgrade } from "@/components/teamspaces/upgrade";
import { WorkItemTypeHierarchyLevelsRoot } from "@/components/work-item-types-new/settings/hierarchy/root";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
// types
import { EWorkspaceFeatures } from "@/types/workspace-feature";
// local imports
import type { Route } from "./+types/page";
import { WorkItemTypeHierarchyWorkspaceSettingsHeader } from "./header";

function WorkItemTypeHierarchySettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  const router = useAppRouter();
  // store hooks
  const { getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { isWorkspaceFeatureEnabled, updateWorkspaceFeature } = useWorkspaceFeatures();
  const { t } = useTranslation();
  // derived values
  const currentWorkspaceRole = getWorkspaceRoleByWorkspaceSlug(workspaceSlug);
  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("work_item_type_hierarchy.settings.title")}`
    : undefined;
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;
  const isWorkItemHierarchyFeatureEnabled = isWorkspaceFeatureEnabled(
    EWorkspaceFeatures.IS_WORK_ITEM_HIERARCHY_ENABLED
  );
  const isWorkspaceWorkItemTypesEnabled = !isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_WORK_ITEM_TYPES_ENABLED);
  const disableToggling = !isWorkspaceWorkItemTypesEnabled || isWorkItemHierarchyFeatureEnabled;

  if (!isAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

  const toggleWorkItemHierarchyFeature = async () => {
    try {
      const payload = {
        [EWorkspaceFeatures.IS_WORK_ITEM_HIERARCHY_ENABLED]: !isWorkItemHierarchyFeatureEnabled,
      };
      const toggleWorkItemHierarchyFeaturePromise = updateWorkspaceFeature(workspaceSlug, payload);
      setPromiseToast(toggleWorkItemHierarchyFeaturePromise, {
        loading: "Updating work item hierarchy feature...",
        success: {
          title: "Success",
          message: () =>
            `Work item hierarchy feature ${isWorkItemHierarchyFeatureEnabled ? "disabled" : "enabled"} successfully!`,
        },
        error: {
          title: "Error",
          message: () => "Failed to update work item hierarchy feature!",
        },
      });
      await toggleWorkItemHierarchyFeaturePromise;
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SettingsContentWrapper header={<WorkItemTypeHierarchyWorkspaceSettingsHeader />}>
      <PageHead title={pageTitle} />
      <SettingsHeading
        title={t("work_item_type_hierarchy.settings.title")}
        description={t("work_item_type_hierarchy.settings.description")}
      />
      <WithFeatureFlagHOC flag="WORKITEM_TYPE_HIERARCHY" fallback={<TeamspaceUpgrade />} workspaceSlug={workspaceSlug}>
        <div
          className={cn("mt-6", {
            "opacity-60 pointer-events-none": disableToggling,
          })}
        >
          <SettingsBoxedControlItem
            title={t("work_item_type_hierarchy.settings.enable_control.title")}
            description={t("work_item_type_hierarchy.settings.enable_control.description")}
            control={
              <Tooltip
                tooltipContent={t("work_item_type_hierarchy.settings.enable_control.tooltip")}
                disabled={disableToggling}
                position="left"
              >
                <Switch
                  value={isWorkItemHierarchyFeatureEnabled}
                  onChange={toggleWorkItemHierarchyFeature}
                  disabled={disableToggling}
                />
              </Tooltip>
            }
          />
        </div>
        {isWorkspaceWorkItemTypesEnabled ? (
          isWorkItemHierarchyFeatureEnabled && (
            <div className="mt-12">
              <WorkItemTypeHierarchyLevelsRoot />
            </div>
          )
        ) : (
          <div className="bg-warning-subtle border border-warning-subtle text-warning-secondary shadow-raised-200 rounded-lg py-3.5 px-4 mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TriangleAlert className="shrink-0 size-5" />
              <p className="text-body-sm-medium">
                {t("work_item_type_hierarchy.settings.workspace_work_item_types_disabled_banner.content")}
              </p>
            </div>
            <div className="shrink-0">
              <Button
                variant="secondary"
                onClick={() => router.push(`/${workspaceSlug}/settings/work-item-types/`)}
                appendIcon={<ArrowUpRight />}
              >
                {t("work_item_type_hierarchy.settings.workspace_work_item_types_disabled_banner.cta")}
              </Button>
            </div>
          </div>
        )}
      </WithFeatureFlagHOC>
    </SettingsContentWrapper>
  );
}

export default observer(WorkItemTypeHierarchySettingsPage);
