import { useRef } from "react";
import { observer } from "mobx-react";
// Plane
import { Logo, Spinner } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { ListItem } from "@/components/core/list";
import { useProject, useWorkspace } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web
import Attributes from "@/plane-web/components/projects/layouts/attributes";
// local components
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
import { QuickActions } from "./quick-actions";

type Props = {
  workspaceSlug: string;
  projectId: string;
  initiativeId: string;
};

export const ProjectItem = observer((props: Props) => {
  const { workspaceSlug, initiativeId, projectId } = props;
  // store hooks
  const { getProjectById, updateProject } = useProject();
  const { currentWorkspace } = useWorkspace();
  const { isMobile } = usePlatformOS();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();

  // ref
  const parentRef = useRef(null);

  // derived values
  const isProjectGroupingEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED);

  const projectDetails = getProjectById(projectId);

  if (!projectDetails || !currentWorkspace) return <Spinner />;

  return (
    <ListItem
      title={projectDetails.name}
      itemLink={`/${workspaceSlug}/projects/${projectId}/issues`}
      prependTitleElement={
        <div className="h-6 w-6 flex-shrink-0 grid place-items-center rounded bg-custom-background-90 mr-2">
          <Logo logo={projectDetails.logo_props} size={14} />
        </div>
      }
      quickActionElement={
        <div className="flex shrink-0 items-center gap-2">
          {projectDetails.total_issues > 0 && (
            <span className="text-sm font-medium text-custom-text-400 px-1">{`${projectDetails.completed_issues}/${projectDetails.total_issues}`}</span>
          )}
          <Attributes
            project={projectDetails}
            isArchived={projectDetails.archived_at !== null}
            handleUpdateProject={(data) => updateProject(workspaceSlug.toString(), projectDetails.id, data)}
            workspaceSlug={workspaceSlug.toString()}
            currentWorkspace={currentWorkspace}
            containerClass="px-0 py-0 md:pb-4 lg:py-2"
            displayProperties={{
              state: isProjectGroupingEnabled,
              priority: isProjectGroupingEnabled,
              lead: true,
              date: true,
            }}
          />
          <div className={cn("hidden md:flex")}>
            <QuickActions
              project={projectDetails}
              workspaceSlug={workspaceSlug.toString()}
              initiativeId={initiativeId}
            />
          </div>
        </div>
      }
      isMobile={isMobile}
      parentRef={parentRef}
    />
  );
});
