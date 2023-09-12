import React, { useState, FC, useRef, useEffect } from "react";

import { useRouter } from "next/router";
import { mutate } from "swr";

// react-beautiful-dnd
import { DragDropContext, Draggable, DropResult, Droppable } from "react-beautiful-dnd";
// headless ui
import { Disclosure, Transition } from "@headlessui/react";
// hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
import useProjects from "hooks/use-projects";
// components
import { CreateProjectModal, DeleteProjectModal, SingleSidebarProject } from "components/project";
// services
import projectService from "services/project.service";
// icons
import { Icon } from "components/ui";
import { PlusIcon } from "@heroicons/react/24/outline";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
import { orderArrayBy } from "helpers/array.helper";
// types
import { IProject } from "types";
// fetch-keys
import { PROJECTS_LIST } from "constants/fetch-keys";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";

export const ProjectSidebarList: FC = () => {
  const store: any = useMobxStore();

  const [isFavoriteProjectCreate, setIsFavoriteProjectCreate] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [deleteProjectModal, setDeleteProjectModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<IProject | null>(null);
  const [projectToLeaveId, setProjectToLeaveId] = useState<string | null>(null);

  // router
  const [isScrolled, setIsScrolled] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { user } = useUserAuth();
  const { setToastAlert } = useToast();

  const { projects: allProjects } = useProjects();

  const joinedProjects = allProjects?.filter((p) => p.is_member);
  const favoriteProjects = allProjects?.filter((p) => p.is_favorite);

  const orderedJoinedProjects: IProject[] | undefined = joinedProjects
    ? orderArrayBy(joinedProjects, "sort_order", "ascending")
    : undefined;

  const orderedFavProjects: IProject[] | undefined = favoriteProjects
    ? orderArrayBy(favoriteProjects, "sort_order", "ascending")
    : undefined;

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

    const projectsList =
      (destination.droppableId === "joined-projects"
        ? orderedJoinedProjects
        : orderedFavProjects) ?? [];

    let updatedSortOrder = projectsList[source.index].sort_order;

    if (destination.index === 0) updatedSortOrder = (projectsList[0].sort_order as number) - 1000;
    else if (destination.index === projectsList.length - 1)
      updatedSortOrder = (projectsList[projectsList.length - 1].sort_order as number) + 1000;
    else {
      const destinationSortingOrder = projectsList[destination.index].sort_order as number;
      const relativeDestinationSortingOrder =
        source.index < destination.index
          ? (projectsList[destination.index + 1].sort_order as number)
          : (projectsList[destination.index - 1].sort_order as number);

      updatedSortOrder = (destinationSortingOrder + relativeDestinationSortingOrder) / 2;
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

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      setIsScrolled(scrollTop > 0);
    }
  };

  useEffect(() => {
    const currentContainerRef = containerRef.current;

    if (currentContainerRef) {
      currentContainerRef.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (currentContainerRef) {
        currentContainerRef.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  return (
    <>
      <CreateProjectModal
        isOpen={isProjectModalOpen}
        setIsOpen={setIsProjectModalOpen}
        setToFavorite={isFavoriteProjectCreate}
        user={user}
      />
      <DeleteProjectModal
        isOpen={deleteProjectModal}
        onClose={() => setDeleteProjectModal(false)}
        data={projectToDelete}
        user={user}
      />
      <div
        ref={containerRef}
        className={`h-full overflow-y-auto px-4 space-y-3 pt-3 ${
          isScrolled ? "border-t border-custom-sidebar-border-300" : ""
        }`}
      >
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="favorite-projects">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {orderedFavProjects && orderedFavProjects.length > 0 && (
                  <Disclosure as="div" className="flex flex-col space-y-2" defaultOpen={true}>
                    {({ open }) => (
                      <>
                        {!store?.theme?.sidebarCollapsed && (
                          <div className="group flex justify-between items-center text-xs px-1.5 rounded text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-80 w-full">
                            <Disclosure.Button
                              as="button"
                              type="button"
                              className="group flex items-center gap-1 px-1.5 text-xs font-semibold text-custom-sidebar-text-400 text-left hover:bg-custom-sidebar-background-80 rounded w-full whitespace-nowrap"
                            >
                              Favorites
                              <Icon
                                iconName={open ? "arrow_drop_down" : "arrow_right"}
                                className="group-hover:opacity-100 opacity-0 !text-lg"
                              />
                            </Disclosure.Button>
                            <button
                              className="group-hover:opacity-100 opacity-0"
                              onClick={() => {
                                setIsFavoriteProjectCreate(true);
                                setIsProjectModalOpen(true);
                              }}
                            >
                              <Icon iconName="add" />
                            </button>
                          </div>
                        )}
                        <Disclosure.Panel as="div" className="space-y-2">
                          {orderedFavProjects.map((project, index) => (
                            <Draggable
                              key={project.id}
                              draggableId={project.id}
                              index={index}
                              isDragDisabled={!project.is_member}
                            >
                              {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.draggableProps}>
                                  <SingleSidebarProject
                                    key={project.id}
                                    project={project}
                                    sidebarCollapse={store?.theme?.sidebarCollapsed}
                                    provided={provided}
                                    snapshot={snapshot}
                                    handleDeleteProject={() => handleDeleteProject(project)}
                                    handleCopyText={() => handleCopyText(project.id)}
                                    handleProjectLeave={() => setProjectToLeaveId(project.id)}
                                    shortContextMenu
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                        </Disclosure.Panel>
                        {provided.placeholder}
                      </>
                    )}
                  </Disclosure>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="joined-projects">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {orderedJoinedProjects && orderedJoinedProjects.length > 0 && (
                  <Disclosure as="div" className="flex flex-col space-y-2" defaultOpen={true}>
                    {({ open }) => (
                      <>
                        {!store?.theme?.sidebarCollapsed && (
                          <div className="group flex justify-between items-center text-xs px-1.5 rounded text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-80 w-full">
                            <Disclosure.Button
                              as="button"
                              type="button"
                              className="flex items-center gap-1 font-semibold text-left whitespace-nowrap"
                            >
                              Projects
                              <Icon
                                iconName={open ? "arrow_drop_down" : "arrow_right"}
                                className="group-hover:opacity-100 opacity-0 !text-lg"
                              />
                            </Disclosure.Button>
                            <button
                              className="group-hover:opacity-100 opacity-0"
                              onClick={() => {
                                setIsFavoriteProjectCreate(false);
                                setIsProjectModalOpen(true);
                              }}
                            >
                              <Icon iconName="add" />
                            </button>
                          </div>
                        )}
                        <Transition
                          enter="transition duration-100 ease-out"
                          enterFrom="transform scale-95 opacity-0"
                          enterTo="transform scale-100 opacity-100"
                          leave="transition duration-75 ease-out"
                          leaveFrom="transform scale-100 opacity-100"
                          leaveTo="transform scale-95 opacity-0"
                        >
                          <Disclosure.Panel as="div" className="space-y-2">
                            {orderedJoinedProjects.map((project, index) => (
                              <Draggable key={project.id} draggableId={project.id} index={index}>
                                {(provided, snapshot) => (
                                  <div ref={provided.innerRef} {...provided.draggableProps}>
                                    <SingleSidebarProject
                                      key={project.id}
                                      project={project}
                                      sidebarCollapse={store?.theme?.sidebarCollapsed}
                                      provided={provided}
                                      snapshot={snapshot}
                                      handleDeleteProject={() => handleDeleteProject(project)}
                                      handleProjectLeave={() => setProjectToLeaveId(project.id)}
                                      handleCopyText={() => handleCopyText(project.id)}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          </Disclosure.Panel>
                        </Transition>
                        {provided.placeholder}
                      </>
                    )}
                  </Disclosure>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {joinedProjects && joinedProjects.length === 0 && (
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 text-sm text-custom-sidebar-text-200"
            onClick={() => {
              const e = new KeyboardEvent("keydown", {
                key: "p",
              });
              document.dispatchEvent(e);
            }}
          >
            <PlusIcon className="h-5 w-5" />
            {!store?.theme?.sidebarCollapsed && "Add Project"}
          </button>
        )}
      </div>
    </>
  );
};
