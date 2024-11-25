"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
// components
import { PageHead } from "@/components/core";
// hooks
import Root from "@/components/project/root";
import { useWorkspace } from "@/hooks/store";
// plane web components
import { WorkspaceProjectsRoot } from "@/plane-web/components/projects";
import { useProjectFilter, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { E_FEATURE_FLAGS, useFlag } from "@/plane-web/hooks/store/use-flag";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
import { EProjectLayouts } from "@/plane-web/types/workspace-project-filters";

export const ProjectPageRoot = observer(() => {
  // store
  const { workspaceSlug } = useParams();
  const { currentWorkspace } = useWorkspace();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const pathname = usePathname();
  const { updateAttributes, updateLayout } = useProjectFilter();

  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Projects` : undefined;
  const currentWorkspaceId = currentWorkspace?.id;
  const isProjectGroupingEnabled =
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED) &&
    useFlag(workspaceSlug.toString(), E_FEATURE_FLAGS.PROJECT_GROUPING);
  const isArchived = pathname.includes("/archives");

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
