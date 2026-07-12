/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Layers, Milestone, Timer } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setPromiseToast, TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { IProject } from "@plane/types";
import { CycleIcon, IntakeIcon, ModuleIcon, PageIcon, ViewsIcon } from "@plane/propel/icons";
import { AlertModalCore, ToggleSwitch } from "@plane/ui";
// components
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useIssueTypes } from "@/hooks/store/use-issue-types";
import { useProject } from "@/hooks/store/use-project";
// plane web imports
import { UpgradeBadge } from "@/plane-web/components/workspace/upgrade-badge";
// local imports
import { ProjectFeatureToggle } from "./helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
};

const PROJECT_FEATURES_LIST = {
  cycles: {
    key: "cycles",
    property: "cycle_view",
    title: "Cycles",
    description: "Timebox work as you see fit per project and change frequency from one period to the next.",
    icon: <CycleIcon className="h-5 w-5 flex-shrink-0 rotate-180 text-tertiary" />,
    isPro: false,
    isEnabled: true,
  },
  modules: {
    key: "modules",
    property: "module_view",
    title: "Modules",
    description: "Group work into sub-project-like set-ups with their own leads and assignees.",
    icon: <ModuleIcon width={20} height={20} className="flex-shrink-0 text-tertiary" />,
    isPro: false,
    isEnabled: true,
  },
  views: {
    key: "views",
    property: "issue_views_view",
    title: "Views",
    description: "Save sorts, filters, and display options for later or share them.",
    icon: <ViewsIcon className="h-5 w-5 flex-shrink-0 text-tertiary" />,
    isPro: false,
    isEnabled: true,
  },
  pages: {
    key: "pages",
    property: "page_view",
    title: "Pages",
    description: "Write anything like you write anything.",
    icon: <PageIcon className="h-5 w-5 flex-shrink-0 text-tertiary" />,
    isPro: false,
    isEnabled: true,
  },
  inbox: {
    key: "intake",
    property: "inbox_view",
    title: "Intake",
    description: "Consider and discuss work items before you add them to your project.",
    icon: <IntakeIcon className="h-5 w-5 flex-shrink-0 text-tertiary" />,
    isPro: false,
    isEnabled: true,
  },
  time_tracking: {
    key: "time_tracking",
    property: "is_time_tracking_enabled",
    title: "Time Tracking",
    description: "Log time spent on work items and projects.",
    icon: <Timer className="h-5 w-5 flex-shrink-0 text-tertiary" />,
    isPro: false,
    isEnabled: true,
  },
  milestones: {
    key: "milestones",
    property: "is_milestone_enabled",
    title: "Milestones",
    description: "Milestones provide a layer to align work items toward shared completion dates.",
    icon: <Milestone className="h-5 w-5 flex-shrink-0 text-tertiary" />,
    isPro: false,
    isEnabled: true,
  },
};

export const ProjectFeaturesList = observer(function ProjectFeaturesList(props: Props) {
  const { workspaceSlug, projectId, isAdmin } = props;
  // states
  const [isIssueTypeModalOpen, setIsIssueTypeModalOpen] = useState(false);
  const [isEnablingIssueTypes, setIsEnablingIssueTypes] = useState(false);
  // store hooks
  const { t } = useTranslation();
  const { getProjectById, updateProject } = useProject();
  const { enableIssueTypes } = useIssueTypes();
  // derived values
  const currentProjectDetails = getProjectById(projectId);
  const isIssueTypeEnabled = Boolean(currentProjectDetails?.is_issue_type_enabled);

  const handleSubmit = (_featureKey: string, featureProperty: string) => {
    if (!workspaceSlug || !projectId || !currentProjectDetails) return;

    // making the request to update the project feature
    const settingsPayload = {
      [featureProperty]: !currentProjectDetails?.[featureProperty as keyof IProject],
    };
    const updateProjectPromise = updateProject(workspaceSlug, projectId, settingsPayload);

    setPromiseToast(updateProjectPromise, {
      loading: "Updating project feature...",
      success: {
        title: "Success!",
        message: () => "Project feature updated successfully.",
      },
      error: {
        title: "Error!",
        message: () => "Something went wrong while updating project feature. Please try again.",
      },
    });
    void updateProjectPromise.then(() => {
      return undefined;
    });
  };

  // enabling work item types is irreversible and triggers the default + epic seeding on the backend
  const handleEnableIssueTypes = async () => {
    if (!workspaceSlug || !projectId) return;
    setIsEnablingIssueTypes(true);
    try {
      await updateProject(workspaceSlug, projectId, { is_issue_type_enabled: true });
      await enableIssueTypes(workspaceSlug, projectId);
      setIsIssueTypeModalOpen(false);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Something went wrong while enabling work item types. Please try again.",
      });
    } finally {
      setIsEnablingIssueTypes(false);
    }
  };

  return (
    <>
      <AlertModalCore
        variant="primary"
        isOpen={isIssueTypeModalOpen}
        handleClose={() => setIsIssueTypeModalOpen(false)}
        handleSubmit={handleEnableIssueTypes}
        isSubmitting={isEnablingIssueTypes}
        title={t("work_item_types.empty_state.enable.confirmation.title")}
        content={t("work_item_types.empty_state.enable.confirmation.description")}
        primaryButtonText={{
          loading: t("work_item_types.empty_state.enable.confirmation.button.loading"),
          default: t("work_item_types.empty_state.enable.confirmation.button.default"),
        }}
      />
      <div>
        <SettingsHeading title={t("projects_and_issues")} description={t("projects_and_issues_description")} />
        <div className="mt-6 flex flex-col gap-y-4">
          {Object.entries(PROJECT_FEATURES_LIST).map(([featureItemKey, featureItem]) => (
            <div key={featureItemKey}>
              <SettingsBoxedControlItem
                title={
                  <span className="flex items-center gap-2">
                    {t(featureItem.key)}
                    {featureItem.isPro && (
                      <Tooltip tooltipContent="Pro feature" position="top">
                        <UpgradeBadge className="rounded-sm" />
                      </Tooltip>
                    )}
                  </span>
                }
                description={t(`${featureItem.key}_description`)}
                control={
                  <ProjectFeatureToggle
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    featureItem={featureItem}
                    value={Boolean(currentProjectDetails?.[featureItem.property as keyof IProject])}
                    handleSubmit={handleSubmit}
                    disabled={!isAdmin}
                  />
                }
              />
              {/* {currentProjectDetails?.[featureItem.property as keyof IProject] && (
                <div className="pl-14">{featureItem.renderChildren?.(currentProjectDetails, workspaceSlug)}</div>
              )} */}
            </div>
          ))}
          {/* work item types (activation is irreversible) */}
          <div>
            <SettingsBoxedControlItem
              title={
                <span className="flex items-center gap-2">
                  <Layers className="h-5 w-5 flex-shrink-0 text-tertiary" />
                  {t("work_item_types.label")}
                </span>
              }
              description={t("work_item_types.empty_state.enable.description")}
              control={
                <ToggleSwitch
                  value={isIssueTypeEnabled}
                  onChange={() => {
                    if (!isIssueTypeEnabled) setIsIssueTypeModalOpen(true);
                  }}
                  disabled={!isAdmin || isIssueTypeEnabled}
                  size="sm"
                />
              }
            />
          </div>
        </div>
      </div>
    </>
  );
});
