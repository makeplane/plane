import React, { useState, FC } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// hooks
import useToast from "hooks/use-toast";
import useTheme from "hooks/use-theme";
import useUserAuth from "hooks/use-user-auth";
// services
import projectService from "services/project.service";
// components
import { CreateProjectModal, DeleteProjectModal, SingleSidebarProject } from "components/project";
// ui
import { Loader } from "components/ui";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import { IFavoriteProject, IProject } from "types";
// fetch-keys
import { FAVORITE_PROJECTS_LIST, PROJECTS_LIST } from "constants/fetch-keys";

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

  const { data: favoriteProjects } = useSWR(
    workspaceSlug ? FAVORITE_PROJECTS_LIST(workspaceSlug.toString()) : null,
    () => (workspaceSlug ? projectService.getFavoriteProjects(workspaceSlug.toString()) : null)
  );

  const { data: projects } = useSWR(
    workspaceSlug ? PROJECTS_LIST(workspaceSlug as string) : null,
    () => (workspaceSlug ? projectService.getProjects(workspaceSlug as string) : null)
  );
  const normalProjects = projects?.filter((p) => !p.is_favorite) ?? [];

  const handleAddToFavorites = (project: IProject) => {
    if (!workspaceSlug) return;

    projectService
      .addProjectToFavorites(workspaceSlug as string, {
        project: project.id,
      })
      .then(() => {
        mutate<IProject[]>(
          PROJECTS_LIST(workspaceSlug as string),
          (prevData) =>
            (prevData ?? []).map((p) => ({
              ...p,
              is_favorite: p.id === project.id ? true : p.is_favorite,
            })),
          false
        );
        mutate(FAVORITE_PROJECTS_LIST(workspaceSlug as string));

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Successfully added the project to favorites.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't remove the project from favorites. Please try again.",
        });
      });
  };

  const handleRemoveFromFavorites = (project: IProject) => {
    if (!workspaceSlug) return;

    projectService
      .removeProjectFromFavorites(workspaceSlug as string, project.id)
      .then(() => {
        mutate<IProject[]>(
          PROJECTS_LIST(workspaceSlug as string),
          (prevData) =>
            (prevData ?? []).map((p) => ({
              ...p,
              is_favorite: p.id === project.id ? false : p.is_favorite,
            })),
          false
        );
        mutate<IFavoriteProject[]>(
          FAVORITE_PROJECTS_LIST(workspaceSlug as string),
          (prevData) => (prevData ?? []).filter((p) => p.project !== project.id),
          false
        );

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Successfully removed the project from favorites.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't remove the project from favorites. Please try again.",
        });
      });
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
      <div className="mt-2.5 h-full overflow-y-auto border-t border-custom-sidebar-border-100 bg-custom-sidebar-background-100 pt-2.5">
        {favoriteProjects && favoriteProjects.length > 0 && (
          <div className="mt-3 flex flex-col space-y-2 px-3">
            {!sidebarCollapse && (
              <h5 className="text-sm font-semibold text-custom-sidebar-text-200">Favorites</h5>
            )}
            {favoriteProjects.map((favoriteProject) => {
              const project = favoriteProject.project_detail;

              return (
                <SingleSidebarProject
                  key={project.id}
                  project={project}
                  sidebarCollapse={sidebarCollapse}
                  handleDeleteProject={() => handleDeleteProject(project)}
                  handleCopyText={() => handleCopyText(project.id)}
                  handleRemoveFromFavorites={() => handleRemoveFromFavorites(project)}
                />
              );
            })}
          </div>
        )}
        <div className="flex flex-col space-y-2 p-3">
          {!sidebarCollapse && (
            <h5 className="text-sm font-semibold text-custom-sidebar-text-200">Projects</h5>
          )}
          {projects ? (
            <>
              {normalProjects.length > 0 ? (
                normalProjects.map((project) => (
                  <SingleSidebarProject
                    key={project.id}
                    project={project}
                    sidebarCollapse={sidebarCollapse}
                    handleDeleteProject={() => handleDeleteProject(project)}
                    handleCopyText={() => handleCopyText(project.id)}
                    handleAddToFavorites={() => handleAddToFavorites(project)}
                  />
                ))
              ) : (
                <div className="space-y-3 text-center">
                  {!sidebarCollapse && (
                    <h4 className="text-sm text-custom-text-200">
                      You don{"'"}t have any project yet
                    </h4>
                  )}
                  <button
                    type="button"
                    className="group flex w-full items-center justify-center gap-2 rounded-md bg-custom-background-80 p-2 text-xs text-custom-text-100"
                    onClick={() => setCreateProjectModal(true)}
                  >
                    <PlusIcon className="h-4 w-4" />
                    {!sidebarCollapse && "Create Project"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="w-full">
              <Loader className="space-y-5">
                <div className="space-y-2">
                  <Loader.Item height="30px" />
                  <Loader.Item height="15px" width="80%" />
                  <Loader.Item height="15px" width="80%" />
                  <Loader.Item height="15px" width="80%" />
                </div>
                <div className="space-y-2">
                  <Loader.Item height="30px" />
                  <Loader.Item height="15px" width="80%" />
                  <Loader.Item height="15px" width="80%" />
                  <Loader.Item height="15px" width="80%" />
                </div>
              </Loader>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
