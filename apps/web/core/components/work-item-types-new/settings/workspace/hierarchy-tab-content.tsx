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

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { UpgradeIcon } from "@plane/propel/icons";
import { Switch } from "@plane/propel/switch";
import { setPromiseToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
// components
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { useFlag, useWorkspaceFeatures, useWorkspaceSubscription } from "@/plane-web/hooks/store";
// types
import { EWorkspaceFeatures } from "@/types/workspace-feature";
// local imports
import { WorkItemTypeHierarchyLevelsRoot } from "../hierarchy/root";
import { Button } from "@plane/propel/button";
import { ArrowUpRight, TriangleAlert } from "lucide-react";

type Props = {
  workspaceSlug: string;
};

export const WorkspaceWorkItemTypesHierarchyTabContent = observer(function WorkspaceWorkItemTypesHierarchyTabContent({
  workspaceSlug,
}: Props) {
  // router
  const router = useAppRouter();
  // store hooks
  const { togglePaidPlanModal } = useWorkspaceSubscription();
  const { isWorkspaceFeatureEnabled, updateWorkspaceFeature } = useWorkspaceFeatures();
  // derived values
  const isWorkItemTypesHierarchyFlagAvailable = useFlag(workspaceSlug, "WORKITEM_TYPE_HIERARCHY");
  const isWorkItemHierarchyFeatureEnabled = isWorkspaceFeatureEnabled(
    workspaceSlug,
    EWorkspaceFeatures.IS_WORK_ITEM_HIERARCHY_ENABLED
  );
  const isWorkspaceWorkItemTypesEnabled = isWorkspaceFeatureEnabled(
    workspaceSlug,
    EWorkspaceFeatures.IS_WORK_ITEM_TYPES_ENABLED
  );
  const disableToggling =
    isWorkItemTypesHierarchyFlagAvailable && (!isWorkspaceWorkItemTypesEnabled || isWorkItemHierarchyFeatureEnabled);

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
  // hooks
  const { t } = useTranslation();

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2">
        <h6 className="text-h6-medium">{t("work_item_type_hierarchy.settings.title")}</h6>
        <p className="text-body-xs-regular text-secondary">{t("work_item_type_hierarchy.settings.description")}</p>
      </div>
      <div
        className={cn("mt-4", {
          "opacity-60": disableToggling,
        })}
      >
        <SettingsBoxedControlItem
          title={t("work_item_type_hierarchy.settings.enable_control.title")}
          description={t("work_item_type_hierarchy.settings.enable_control.description")}
          control={
            isWorkItemTypesHierarchyFlagAvailable ? (
              <Tooltip tooltipContent={t("work_item_type_hierarchy.settings.enable_control.tooltip")} position="top">
                {/* NOTE: added a wrapper span since disabling Switch removes pointer events thus ultimately disabling the tooltip. */}
                <span>
                  <Switch
                    value={isWorkItemHierarchyFeatureEnabled}
                    onChange={toggleWorkItemHierarchyFeature}
                    disabled={isWorkItemHierarchyFeatureEnabled}
                  />
                </span>
              </Tooltip>
            ) : (
              <Button variant="secondary" prependIcon={<UpgradeIcon />} onClick={() => togglePaidPlanModal(true)}>
                {t("common.upgrade")}
              </Button>
            )
          }
        />
      </div>
      {isWorkspaceWorkItemTypesEnabled ? (
        isWorkItemTypesHierarchyFlagAvailable &&
        isWorkItemHierarchyFeatureEnabled && (
          <div className="mt-6">
            <WorkItemTypeHierarchyLevelsRoot workspaceSlug={workspaceSlug} />
          </div>
        )
      ) : (
        <div className="bg-warning-subtle border border-warning-subtle text-warning-secondary shadow-raised-200 rounded-lg py-3.5 px-4 mt-4 flex items-center justify-between">
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
    </div>
  );
});
