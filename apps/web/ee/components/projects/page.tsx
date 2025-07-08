"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import useSWR from "swr";
// components
import { PageHead } from "@/components/core";
// hooks
import Root from "@/components/project/root";
import { useProject, useWorkspace } from "@/hooks/store";
// plane web components
import { WorkspaceProjectsRoot } from "@/plane-web/components/projects";
import { useProjectFilter, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { useFlag } from "@/plane-web/hooks/store/use-flag";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
import { EProjectLayouts } from "@/plane-web/types/workspace-project-filters";

export const ProjectPageRoot = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // store
  const { currentWorkspace } = useWorkspace();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const { fetchProjects } = useProject();
  const { updateAttributes, updateLayout } = useProjectFilter();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Projects` : undefined;
  const currentWorkspaceId = currentWorkspace?.id;
  const isProjectGroupingFlagEnabled = useFlag(workspaceSlug.toString(), "PROJECT_GROUPING");
  const isProjectGroupingEnabled =
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED) && isProjectGroupingFlagEnabled;
  const isArchived = pathname.includes("/archives");

  // fetching workspace projects
  useSWR(
    workspaceSlug && currentWorkspace ? `WORKSPACE_PROJECTS_${workspaceSlug}` : null,
    workspaceSlug && currentWorkspace ? () => fetchProjects(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  useEffect(() => {
    if (isArchived) {
      updateAttributes(workspaceSlug.toString(), "archived", true, isArchived);
      updateLayout(workspaceSlug.toString(), EProjectLayouts.GALLERY, isArchived);
    } else {
      updateAttributes(workspaceSlug.toString(), "archived", false, isArchived);
    }
  }, [isArchived, updateAttributes, updateLayout, workspaceSlug]);

  if (!currentWorkspaceId || !workspaceSlug) return <></>;
  return (
    <>
      <PageHead title={pageTitle} />

      {isProjectGroupingEnabled ? (
        <div className="h-full w-full overflow-hidden">
          <WorkspaceProjectsRoot
            workspaceSlug={workspaceSlug.toString()}
            workspaceId={currentWorkspaceId}
            isArchived={isArchived}
          />
        </div>
      ) : (
        <Root />
      )}
    </>
  );
});
