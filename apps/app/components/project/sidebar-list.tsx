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
import { CreateProjectModal, DeleteProjectModal, SingleSidebarProject } from "components/project";
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

  // states
  const [isCreateProjectModal, setCreateProjectModal] = useState(false);
  // theme
  const { collapsed: sidebarCollapse } = useTheme();
  // toast handler
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
      <CreateProjectModal
        isOpen={isCreateProjectModal}
        setIsOpen={setCreateProjectModal}
        user={user}
      />
      <DeleteProjectModal
        isOpen={deleteProjectModal}
        onClose={() => setDeleteProjectModal(false)}
        data={projectToDelete}
        user={user}
      />
      <div className="h-full overflow-y-auto mt-5 px-4">
        {favoriteProjects && favoriteProjects.length > 0 && (
          <div className="flex flex-col space-y-2">
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
        <div className="flex flex-col space-y-2 mt-5">
          {!sidebarCollapse && (
            <h5 className="text-sm font-medium text-custom-sidebar-text-200">Projects</h5>
          )}
          {nonFavoriteProjects &&
            nonFavoriteProjects.length > 0 &&
            nonFavoriteProjects.map((project) => (
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
      </div>
    </>
  );
};
