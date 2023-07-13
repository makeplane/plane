import React, { useState, FC } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// hooks
import useToast from "hooks/use-toast";
import useTheme from "hooks/use-theme";
import useUserAuth from "hooks/use-user-auth";
import useProjects from "hooks/use-projects";
// services
import projectService from "services/project.service";
// components
import { DeleteProjectModal, SingleSidebarProject } from "components/project";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import { IProject } from "types";
// fetch-keys
import { PROJECTS_LIST } from "constants/fetch-keys";

export const ProjectSidebarList: FC = () => {
  const [deleteProjectModal, setDeleteProjectModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<IProject | null>(null);

  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { user } = useUserAuth();

  const { collapsed: sidebarCollapse } = useTheme();
  const { setToastAlert } = useToast();

  const { projects: favoriteProjects } = useProjects(true);
  const { projects: nonFavoriteProjects } = useProjects(false);

  const handleAddToFavorites = (project: IProject) => {
    if (!workspaceSlug) return;

    mutate<IProject[]>(
      PROJECTS_LIST(workspaceSlug as string, { is_favorite: true }),
      (prevData) => [...(prevData ?? []), { ...project, is_favorite: true }],
      false
    );
    mutate<IProject[]>(
      PROJECTS_LIST(workspaceSlug as string, { is_favorite: false }),
      (prevData) => (prevData ?? []).filter((p) => p.id !== project.id),
      false
    );

    projectService
      .addProjectToFavorites(workspaceSlug as string, {
        project: project.id,
      })
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't remove the project from favorites. Please try again.",
        })
      );
  };

  const handleRemoveFromFavorites = (project: IProject) => {
    if (!workspaceSlug) return;

    mutate<IProject[]>(
      PROJECTS_LIST(workspaceSlug as string, { is_favorite: false }),
      (prevData) => [...(prevData ?? []), { ...project, is_favorite: false }],
      false
    );
    mutate<IProject[]>(
      PROJECTS_LIST(workspaceSlug as string, { is_favorite: true }),
      (prevData) => (prevData ?? []).filter((p) => p.id !== project.id),
      false
    );

    projectService.removeProjectFromFavorites(workspaceSlug as string, project.id).catch(() =>
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Couldn't remove the project from favorites. Please try again.",
      })
    );
  };

  const handleDeleteProject = (project: IProject) => {
    setProjectToDelete(project);
    setDeleteProjectModal(true);
  };

  const handleCopyText = (projectId: string) => {
    const originURL =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    copyTextToClipboard(`${originURL}/${workspaceSlug}/projects/${projectId}/issues`).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Project link copied to clipboard.",
      });
    });
  };

  return (
    <>
      <DeleteProjectModal
        isOpen={deleteProjectModal}
        onClose={() => setDeleteProjectModal(false)}
        data={projectToDelete}
        user={user}
      />
      <div className="h-full overflow-y-auto px-4">
        {favoriteProjects && favoriteProjects.length > 0 && (
          <div className="flex flex-col space-y-2 mt-5">
            {!sidebarCollapse && (
              <h5 className="text-sm font-medium text-custom-sidebar-text-200">Favorites</h5>
            )}
            {favoriteProjects.map((project) => (
              <SingleSidebarProject
                key={project.id}
                project={project}
                sidebarCollapse={sidebarCollapse}
                handleDeleteProject={() => handleDeleteProject(project)}
                handleCopyText={() => handleCopyText(project.id)}
                handleRemoveFromFavorites={() => handleRemoveFromFavorites(project)}
              />
            ))}
          </div>
        )}
        {nonFavoriteProjects && nonFavoriteProjects.length > 0 && (
          <div className="flex flex-col space-y-2 mt-5">
            {!sidebarCollapse && (
              <h5 className="text-sm font-medium text-custom-sidebar-text-200">Projects</h5>
            )}
            {nonFavoriteProjects.map((project) => (
              <SingleSidebarProject
                key={project.id}
                project={project}
                sidebarCollapse={sidebarCollapse}
                handleDeleteProject={() => handleDeleteProject(project)}
                handleCopyText={() => handleCopyText(project.id)}
                handleAddToFavorites={() => handleAddToFavorites(project)}
              />
            ))}
          </div>
        )}
        {favoriteProjects &&
          favoriteProjects.length === 0 &&
          nonFavoriteProjects &&
          nonFavoriteProjects.length === 0 && (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-custom-sidebar-text-200 mt-5"
              onClick={() => {
                const e = new KeyboardEvent("keydown", {
                  key: "p",
                });
                document.dispatchEvent(e);
              }}
            >
              <PlusIcon className="h-5 w-5" />
              {!sidebarCollapse && "Add Project"}
            </button>
          )}
      </div>
    </>
  );
};
