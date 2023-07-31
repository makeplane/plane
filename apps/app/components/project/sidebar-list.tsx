import React, { useState, FC } from "react";

import { useRouter } from "next/router";
import { mutate } from "swr";

// react-beautiful-dnd
import { DragDropContext, Draggable, DropResult, Droppable } from "react-beautiful-dnd";
// hooks
import useToast from "hooks/use-toast";
import useTheme from "hooks/use-theme";
import useUserAuth from "hooks/use-user-auth";
import useProjects from "hooks/use-projects";
// components
import { DeleteProjectModal, SingleSidebarProject } from "components/project";
// services
import projectService from "services/project.service";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
import { orderArrayBy } from "helpers/array.helper";
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

  const { projects: allProjects } = useProjects();
  const favoriteProjects = allProjects?.filter((p) => p.is_favorite);

  const orderedAllProjects = allProjects
    ? orderArrayBy(allProjects, "sort_order", "ascending")
    : [];

  const orderedFavProjects = favoriteProjects
    ? orderArrayBy(favoriteProjects, "sort_order", "ascending")
    : [];

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

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination || !workspaceSlug) return;
    if (source.index === destination.index) return;

    const projectList =
      destination.droppableId === "all-projects" ? orderedAllProjects : orderedFavProjects;

    let updatedSortOrder = projectList[source.index].sort_order;
    if (destination.index === 0) {
      updatedSortOrder = projectList[0].sort_order - 1000;
    } else if (destination.index === projectList.length - 1) {
      updatedSortOrder = projectList[projectList.length - 1].sort_order + 1000;
    } else {
      const destinationSortingOrder = projectList[destination.index].sort_order;
      const relativeDestinationSortingOrder =
        source.index < destination.index
          ? projectList[destination.index + 1].sort_order
          : projectList[destination.index - 1].sort_order;

      updatedSortOrder = Math.round(
        (destinationSortingOrder + relativeDestinationSortingOrder) / 2
      );
    }

    mutate<IProject[]>(
      PROJECTS_LIST(workspaceSlug as string, { is_favorite: "all" }),
      (prevData) => {
        if (!prevData) return prevData;
        return prevData.map((p) =>
          p.id === draggableId ? { ...p, sort_order: updatedSortOrder } : p
        );
      },
      false
    );

    await projectService
      .setProjectView(workspaceSlug as string, draggableId, { sort_order: updatedSortOrder })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Something went wrong. Please try again.",
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
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="favorite-projects">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {orderedFavProjects && orderedFavProjects.length > 0 && (
                  <div className="flex flex-col space-y-2 mt-5">
                    {!sidebarCollapse && (
                      <h5 className="text-sm font-medium text-custom-sidebar-text-200">
                        Favorites
                      </h5>
                    )}
                    {orderedFavProjects.map((project, index) => (
                      <Draggable key={project.id} draggableId={project.id} index={index}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.draggableProps}>
                            <SingleSidebarProject
                              key={project.id}
                              project={project}
                              sidebarCollapse={sidebarCollapse}
                              provided={provided}
                              snapshot={snapshot}
                              handleDeleteProject={() => handleDeleteProject(project)}
                              handleCopyText={() => handleCopyText(project.id)}
                              shortContextMenu
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="all-projects">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {orderedAllProjects && orderedAllProjects.length > 0 && (
                  <div className="flex flex-col space-y-2 mt-5">
                    {!sidebarCollapse && (
                      <h5 className="text-sm font-medium text-custom-sidebar-text-200">Projects</h5>
                    )}
                    {orderedAllProjects.map((project, index) => (
                      <Draggable key={project.id} draggableId={project.id} index={index}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.draggableProps}>
                            <SingleSidebarProject
                              key={project.id}
                              project={project}
                              sidebarCollapse={sidebarCollapse}
                              provided={provided}
                              snapshot={snapshot}
                              handleDeleteProject={() => handleDeleteProject(project)}
                              handleCopyText={() => handleCopyText(project.id)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        {allProjects && allProjects.length === 0 && (
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
