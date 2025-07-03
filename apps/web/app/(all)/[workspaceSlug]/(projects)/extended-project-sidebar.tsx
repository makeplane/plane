"use client";

import React, { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { Plus, Search } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel, PROJECT_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE, Tooltip } from "@plane/ui";
import { copyUrlToClipboard, orderJoinedProjects } from "@plane/utils";
// components
import { CreateProjectModal } from "@/components/project";
import { SidebarProjectsListItem } from "@/components/workspace";
// hooks
import { useAppTheme, useProject, useUserPermissions } from "@/hooks/store";
import { TProject } from "@/plane-web/types";
import { ExtendedSidebarWrapper } from "./extended-sidebar-wrapper";

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
  const { isExtendedProjectSidebarOpened, toggleExtendedProjectSidebar } = useAppTheme();
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

  const handleClose = () => toggleExtendedProjectSidebar(false);

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
      <ExtendedSidebarWrapper
        isExtendedSidebarOpened={!!isExtendedProjectSidebarOpened}
        extendedSidebarRef={extendedProjectSidebarRef}
        handleClose={handleClose}
        excludedElementId="extended-project-sidebar-toggle"
      >
        <div className="flex flex-col gap-1 w-full sticky top-4 pt-0 px-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-custom-text-300 py-1.5">Projects</span>
            {isAuthorizedUser && (
              <Tooltip tooltipHeading={t("create_project")} tooltipContent="">
                <button
                  type="button"
                  data-ph-element={PROJECT_TRACKER_ELEMENTS.EXTENDED_SIDEBAR_ADD_BUTTON}
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
      </ExtendedSidebarWrapper>
    </>
  );
});
