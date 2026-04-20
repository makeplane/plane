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

import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { PlusIcon, SearchIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { copyUrlToClipboard, orderJoinedProjects } from "@plane/utils";
// components
import { CreateProjectModal } from "@/components/projects/modals/create-project-modal";
import { SidebarProjectsListItem } from "@/components/workspace/sidebar/projects-list-item";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useProject } from "@/hooks/store/use-project";
import type { TProject } from "@/types";
import { ExtendedSidebarWrapper } from "./extended-sidebar-wrapper";

export const ExtendedProjectSidebar = observer(function ExtendedProjectSidebar() {
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
  const { getPartialProjectById, joinedProjectIds: joinedProjects, updateProjectView, permissions } = useProject();

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
  const canCreateProject = workspaceSlug ? permissions.getCanCreate(workspaceSlug) : false;

  const handleClose = useCallback(() => toggleExtendedProjectSidebar(false), [toggleExtendedProjectSidebar]);

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
        className="px-0"
      >
        <div className="flex flex-col gap-1 w-full sticky top-4 px-4">
          <div className="flex items-center justify-between">
            <span className="text-13 font-semibold text-tertiary py-1.5">Projects</span>
            {canCreateProject && (
              <Tooltip tooltipHeading={t("create_project")}>
                <button
                  type="button"
                  className="p-0.5 rounded-sm hover:bg-layer-1 shrink-0 text-tertiary hover:text-secondary transition-colors"
                  onClick={() => {
                    setIsProjectModalOpen(true);
                  }}
                >
                  <PlusIcon className="size-3" />
                </button>
              </Tooltip>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-md border border-subtle bg-surface-1 px-2.5 py-1 w-full">
            <SearchIcon className="h-3.5 w-3.5 text-placeholder" />
            <input
              className="w-full max-w-[234px] border-none bg-transparent text-13 outline-none placeholder:text-placeholder"
              placeholder={t("search")}
              value={searchQuery}
              autoFocus
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center mt-4 p-10">
            <EmptyStateCompact
              title={t("common_empty_state.search.title")}
              description={t("common_empty_state.search.description")}
              assetKey="search"
              assetClassName="size-20"
              align="center"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 overflow-x-hidden overflow-y-auto vertical-scrollbar scrollbar-sm flex-grow mt-4 px-4">
            {filteredProjects.map((projectId, index) => (
              <SidebarProjectsListItem
                key={projectId}
                projectId={projectId}
                handleCopyText={() => handleCopyText(projectId)}
                projectListType={"JOINED"}
                disableDrag={false}
                disableDrop={false}
                isLastChild={index === filteredProjects.length - 1}
                handleOnProjectDrop={handleOnProjectDrop}
                renderInExtendedSidebar
              />
            ))}
          </div>
        )}
      </ExtendedSidebarWrapper>
    </>
  );
});
