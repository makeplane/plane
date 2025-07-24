"use client";

import { useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
// ui
import { Spinner, Tooltip, setToast, TOAST_TYPE, Logo, Row } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useAppTheme, useProject, useWorkspace } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useProjectFilter } from "@/plane-web/hooks/store";
import { EProjectScope } from "@/plane-web/types/workspace-project-filters";
import JoinButton from "../../common/join-button";
import QuickActions from "../../quick-actions";
import Attributes from "../attributes";

interface ProjectBlockProps {
  projectId: string;
  isCurrentBlockDragging?: boolean;
  setIsCurrentBlockDragging?: React.Dispatch<React.SetStateAction<boolean>>;
  canDrag?: boolean;
}

export const ProjectBlock = observer((props: ProjectBlockProps) => {
  const { projectId, isCurrentBlockDragging, canDrag } = props;
  // ref
  const projectRef = useRef<HTMLDivElement | null>(null);
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const router = useRouter();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // hooks
  const { sidebarCollapsed: isSidebarCollapsed } = useAppTheme();
  const { getProjectById, updateProject } = useProject();
  const { currentWorkspace } = useWorkspace();
  const { filters } = useProjectFilter();
  const { isMobile } = usePlatformOS();

  const projectDetails = getProjectById(projectId);

  if (!projectDetails || !currentWorkspace) return <></>;
  return (
    <Row
      ref={projectRef}
      className={cn(
        "group/list-block min-h-[52px] relative flex flex-col gap-2 bg-custom-background-100 hover:bg-custom-background-90 py-4 text-sm transition-colors border border-transparent border-b border-b-custom-border-200 md:py-0",
        {
          "bg-custom-background-80": isCurrentBlockDragging,
          "md:flex-row md:items-center": isSidebarCollapsed,
          "lg:flex-row lg:items-center": !isSidebarCollapsed,
        }
      )}
      onDragStart={() => {
        if (!canDrag) {
          setToast({
            type: TOAST_TYPE.WARNING,
            title: "Cannot move project",
            message: "Drag and drop is disabled for the current grouping",
          });
        }
      }}
    >
      <div className="flex w-full truncate">
        <div className="flex flex-grow items-center gap-0.5 truncate pb-0 md:pt-2 lg:py-2">
          <div className="flex items-center gap-1">
            <div className="h-6 w-6 flex-shrink-0 grid place-items-center rounded bg-custom-background-90 mr-2">
              <Logo logo={projectDetails.logo_props} size={14} />
            </div>
          </div>

          {!!projectDetails.member_role ? (
            <Link
              id={`project-${projectDetails.id}`}
              href={`/${workspaceSlug}/projects/${projectId}/issues`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/${workspaceSlug}/projects/${projectId}/issues`);
              }}
              className={cn("w-full truncate cursor-pointer text-sm text-custom-text-100", {})}
            >
              <Tooltip tooltipContent={projectDetails.name} isMobile={isMobile} position="top-left">
                <p className="truncate mr-2">{projectDetails.name}</p>
              </Tooltip>
            </Link>
          ) : (
            <div
              id={`project-${projectDetails.id}`}
              className={cn("w-full truncate cursor-not-allowed text-sm text-custom-text-100", {})}
            >
              <Tooltip tooltipContent={projectDetails.name} isMobile={isMobile} position="top-left">
                <p className="truncate">{projectDetails.name}</p>
              </Tooltip>
            </div>
          )}
        </div>
        <div
          className={cn("block border border-custom-border-300 rounded h-full m-2", {
            "md:hidden": isSidebarCollapsed,
            "lg:hidden": !isSidebarCollapsed,
          })}
        >
          <QuickActions project={projectDetails} workspaceSlug={workspaceSlug.toString()} />
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <>
          <Attributes
            project={projectDetails}
            isArchived={projectDetails.archived_at !== null}
            handleUpdateProject={(data) => updateProject(workspaceSlug.toString(), projectDetails.id, data)}
            workspaceSlug={workspaceSlug.toString()}
            currentWorkspace={currentWorkspace}
            cta={filters?.scope === EProjectScope.ALL_PROJECTS && <JoinButton project={projectDetails} />}
            containerClass="px-0 py-0 md:pb-4 lg:py-2"
            displayProperties={{ state: true, priority: true, lead: true, members: true, date: true }}
          />
          <div
            className={cn("hidden", {
              "md:flex": isSidebarCollapsed,
              "lg:flex": !isSidebarCollapsed,
            })}
          >
            <QuickActions project={projectDetails} workspaceSlug={workspaceSlug.toString()} />
          </div>
        </>
      </div>
    </Row>
  );
});
