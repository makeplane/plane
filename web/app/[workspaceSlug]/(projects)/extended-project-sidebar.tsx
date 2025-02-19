"use client";

import React, { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { Plus, Search } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE, Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { CreateProjectModal } from "@/components/project";
import { SidebarProjectsListItem } from "@/components/workspace";
// hooks
import { orderJoinedProjects } from "@/helpers/project.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
import { useAppTheme, useProject, useUserPermissions } from "@/hooks/store";
import useExtendedSidebarOutsideClickDetector from "@/hooks/use-extended-sidebar-overview-outside-click";
import { TProject } from "@/plane-web/types";

export const ExtendedProjectSidebar = observer(() => {
  // refs
  const extendedProjectSidebarRef = useRef<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  // states
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  // routers
  const { workspaceSlug } = useParams();
  // store hooks
  const { t } = useTranslation();
  const { sidebarCollapsed, extendedProjectSidebarCollapsed, toggleExtendedProjectSidebar } = useAppTheme();
  const { getPartialProjectById, joinedProjectIds: joinedProjects, updateProjectView } = useProject();
  const { allowPermissions } = useUserPermissions();

  const handleOnProjectDrop = (
    sourceId: string | undefined,
    destinationId: string | undefined,
    shouldDropAtEnd: boolean
  ) => {
    if (!sourceId || !destinationId || !workspaceSlug) return;
    if (sourceId === destinationId) return;

    const joinedProjectsList: TProject[] = [];
    joinedProjects.map((projectId) => {
      const projectDetails = getPartialProjectById(projectId);
      if (projectDetails) joinedProjectsList.push(projectDetails);
    });

    const sourceIndex = joinedProjects.indexOf(sourceId);
    const destinationIndex = shouldDropAtEnd ? joinedProjects.length : joinedProjects.indexOf(destinationId);

    if (joinedProjectsList.length <= 0) return;

    const updatedSortOrder = orderJoinedProjects(sourceIndex, destinationIndex, sourceId, joinedProjectsList);
    if (updatedSortOrder != undefined)
      updateProjectView(workspaceSlug.toString(), sourceId, { sort_order: updatedSortOrder }).catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("error"),
          message: t("something_went_wrong"),
        });
      });
  };

  // filter projects based on search query
  const filteredProjects = joinedProjects.filter((projectId) => {
    const project = getPartialProjectById(projectId);
    if (!project) return false;
    return project.name.toLowerCase().includes(searchQuery.toLowerCase()) || project.identifier.includes(searchQuery);
  });

  // auth
  const isAuthorizedUser = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  useExtendedSidebarOutsideClickDetector(
    extendedProjectSidebarRef,
    () => {
      if (!isProjectModalOpen) {
        toggleExtendedProjectSidebar(false);
      }
    },
    "extended-project-sidebar-toggle"
  );

  const handleCopyText = (projectId: string) => {
    copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/issues`).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("link_copied"),
        message: t("project_link_copied_to_clipboard"),
      });
    });
  };
  return (
    <>
      {workspaceSlug && (
        <CreateProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          setToFavorite={false}
          workspaceSlug={workspaceSlug.toString()}
        />
      )}
      <div
        ref={extendedProjectSidebarRef}
        className={cn(
          "fixed top-0 h-full z-[19] flex flex-col gap-2 w-[300px] transform transition-all duration-300 ease-in-out bg-custom-sidebar-background-100 border-r border-custom-sidebar-border-200 shadow-md",
          {
            "translate-x-0 opacity-100 pointer-events-auto": extendedProjectSidebarCollapsed,
            "-translate-x-full opacity-0 pointer-events-none": !extendedProjectSidebarCollapsed,
            "left-[70px]": sidebarCollapsed,
            "left-[250px]": !sidebarCollapsed,
          }
        )}
      >
        <div className="flex flex-col gap-1 w-full sticky top-4 pt-0 px-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-custom-text-300 py-1.5">Projects</span>
            {isAuthorizedUser && (
              <Tooltip tooltipHeading={t("create_project")} tooltipContent="">
                <button
                  type="button"
                  className="p-0.5 rounded hover:bg-custom-sidebar-background-80 flex-shrink-0"
                  onClick={() => {
                    setIsProjectModalOpen(true);
                  }}
                >
                  <Plus className="size-3" />
                </button>
              </Tooltip>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-md border border-custom-border-200 bg-custom-background-100 px-2.5 py-1 w-full">
            <Search className="h-3.5 w-3.5 text-custom-text-400" />
            <input
              className="w-full max-w-[234px] border-none bg-transparent text-sm outline-none placeholder:text-custom-text-400"
              placeholder={t("search")}
              value={searchQuery}
              autoFocus
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-0.5 overflow-x-hidden overflow-y-auto vertical-scrollbar scrollbar-sm flex-grow mt-4 px-4">
          {filteredProjects.map((projectId, index) => (
            <SidebarProjectsListItem
              key={projectId}
              projectId={projectId}
              handleCopyText={() => handleCopyText(projectId)}
              projectListType={"JOINED"}
              disableDrag={false}
              disableDrop={false}
              isLastChild={index === joinedProjects.length - 1}
              handleOnProjectDrop={handleOnProjectDrop}
              renderInExtendedSidebar
            />
          ))}
        </div>
      </div>
    </>
  );
});
