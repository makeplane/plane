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

import { useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { Row } from "@plane/ui";
// helpers
import { cn, joinUrlPath } from "@plane/utils";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useProjectFilter } from "@/plane-web/hooks/store";
import { EProjectScope } from "@/types/workspace-project-filters";
import { Attributes } from "../attributes";
import { QuickActions } from "@/components/projects/common/quick-actions";
import { JoinButton } from "@/components/projects/common/join-button";

interface ProjectBlockProps {
  projectId: string;
  isCurrentBlockDragging?: boolean;
  setIsCurrentBlockDragging?: React.Dispatch<React.SetStateAction<boolean>>;
  canDrag?: boolean;
}

export const ProjectBlock = observer(function ProjectBlock(props: ProjectBlockProps) {
  const { projectId, isCurrentBlockDragging, canDrag } = props;
  // ref
  const projectRef = useRef<HTMLDivElement | null>(null);
  // router
  const { workspaceSlug: routerWorkspaceSlug, teamspaceId } = useParams();
  const router = useRouter();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // hooks
  const { sidebarCollapsed: isSidebarCollapsed } = useAppTheme();
  const { getProjectById, updateProject } = useProject();
  const { currentWorkspace } = useWorkspace();
  const { filters } = useProjectFilter();
  const { isMobile } = usePlatformOS();

  const projectDetails = getProjectById(projectId);

  const projectLink = workspaceSlug
    ? teamspaceId
      ? joinUrlPath(workspaceSlug, "teamspaces", teamspaceId.toString(), "projects", projectId)
      : joinUrlPath(workspaceSlug, "projects", projectId, "issues")
    : undefined;

  if (!projectDetails || !currentWorkspace) return <></>;
  return (
    <Row
      ref={projectRef}
      className={cn(
        "group/list-block min-h-[52px] relative flex flex-col gap-2 bg-surface-1 hover:bg-layer-1 py-4 text-13 transition-colors border border-transparent border-b border-b-subtle-1 md:py-0",
        {
          "bg-layer-1": isCurrentBlockDragging,
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
            <div className="h-6 w-6 flex-shrink-0 grid place-items-center rounded-sm bg-layer-1 mr-2">
              <Logo logo={projectDetails.logo_props} size={14} />
            </div>
          </div>

          {!!projectDetails.member_role && projectLink ? (
            <Link
              id={`project-${projectDetails.id}`}
              href={projectLink}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(projectLink);
              }}
              className={cn("w-full truncate cursor-pointer text-13 text-primary", {})}
            >
              <Tooltip tooltipContent={projectDetails.name} isMobile={isMobile} position="top-start">
                <p className="truncate mr-2">{projectDetails.name}</p>
              </Tooltip>
            </Link>
          ) : (
            <div
              id={`project-${projectDetails.id}`}
              className={cn("w-full truncate cursor-not-allowed text-13 text-primary", {})}
            >
              <Tooltip tooltipContent={projectDetails.name} isMobile={isMobile} position="top-start">
                <p className="truncate">{projectDetails.name}</p>
              </Tooltip>
            </div>
          )}
        </div>
        <div
          className={cn("block border border-subtle-1 rounded-sm h-full m-2", {
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
