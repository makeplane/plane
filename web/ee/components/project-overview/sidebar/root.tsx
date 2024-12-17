"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Activity } from "lucide-react";
import { InfoFillIcon, Tabs, UpdatesIcon } from "@plane/ui";

import { cn } from "@/helpers/common.helper";
// hooks

// local components

import { useProject, useWorkspace } from "@/hooks/store";
import { useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";
import { TProject } from "@/plane-web/types";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
import { ProjectActivity } from "./project-activity";
import { ProjectPropertiesSidebar } from "./properties";
import { UpgradeProperties } from "./properties/upgrade";
import { SidebarTabContent } from "./sidebar-tab-content";
import { ProjectUpdates } from "./updates/root";
import { UpgradeUpdates } from "./updates/upgrade";

type TEpicDetailsSidebarProps = {
  project: TProject;
};

export const ProjectDetailsSidebar: FC<TEpicDetailsSidebarProps> = observer((props) => {
  const { project } = props;
  const { workspaceSlug } = useParams();
  // store hooks
  const { updateProject } = useProject();
  const { features } = useProjectAdvanced();
  const { currentWorkspace } = useWorkspace();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();

  // derived
  const isProjectUpdatesEnabled =
    features &&
    features[project.id] &&
    features[project.id].is_project_updates_enabled &&
    useFlag(workspaceSlug.toString(), "PROJECT_UPDATES");

  const isProjectGroupingEnabled =
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED) &&
    useFlag(workspaceSlug.toString(), "PROJECT_GROUPING");

  if (!project || !currentWorkspace) return null;

  const handleUpdateProject = (data: Partial<TProject>) => {
    updateProject(workspaceSlug.toString(), project.id, data);
  };

  const PROJECT_OVERVIEW_DETAILS_SIDEBAR_TABS = [
    {
      key: "properties",

      icon: InfoFillIcon,
      content: (
        <SidebarTabContent title="Properties">
          {isProjectGroupingEnabled ? (
            <ProjectPropertiesSidebar
              project={project}
              isArchived={project.archived_at !== null}
              handleUpdateProject={handleUpdateProject}
              workspaceSlug={workspaceSlug.toString()}
              currentWorkspace={currentWorkspace}
            />
          ) : (
            <UpgradeProperties workspaceSlug={workspaceSlug.toString()} projectId={project.id} />
          )}
        </SidebarTabContent>
      ),
    },
    {
      key: "updates",
      icon: UpdatesIcon,
      content: isProjectUpdatesEnabled ? (
        <ProjectUpdates />
      ) : (
        <UpgradeUpdates workspaceSlug={workspaceSlug.toString()} projectId={project.id} />
      ),
    },
    {
      key: "activity",
      icon: Activity,
      content: (
        <SidebarTabContent title="Activity">
          <ProjectActivity workspaceSlug={workspaceSlug.toString()} projectId={project.id} />
        </SidebarTabContent>
      ),
    },
  ];

  return (
    <div
      className={cn(
        `!fixed z-[5] flex flex-col gap-4 p-6 h-full border-l border-custom-border-200 bg-custom-sidebar-background-100 py-5 md:relative transition-[width] ease-linear overflow-hidden overflow-y-auto`
      )}
      style={{
        width: "inherit",
      }}
    >
      <Tabs
        tabs={PROJECT_OVERVIEW_DETAILS_SIDEBAR_TABS}
        storageKey={`project-detail-sidebar-${project.id}`}
        defaultTab="properties"
        tabPanelClassName="h-full"
      />
    </div>
  );
});
