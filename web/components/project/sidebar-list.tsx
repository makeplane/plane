import React, { useState, FC, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { DragDropContext, Draggable, DropResult, Droppable } from "react-beautiful-dnd";
import { Disclosure, Transition } from "@headlessui/react";
import { observer } from "mobx-react-lite";
// hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
// components
import { CreateProjectModal, ProjectSidebarListItem } from "components/project";

// icons
import { Icon } from "components/ui";
import { PlusIcon } from "@heroicons/react/24/outline";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
import { orderArrayBy } from "helpers/array.helper";
// types
import { IProject } from "types";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";

export const ProjectSidebarList: FC = observer(() => {
  const { theme: themeStore, project: projectStore } = useMobxStore();
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // swr
  useSWR(
    workspaceSlug ? "PROJECTS_LIST" : null,
    workspaceSlug ? () => projectStore.fetchProjects(workspaceSlug?.toString()) : null
  );
  // states
  const [isFavoriteProjectCreate, setIsFavoriteProjectCreate] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // scroll animation state
  // refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  // user
  const { user } = useUserAuth();
  // toast
  const { setToastAlert } = useToast();

  const joinedProjects = workspaceSlug && projectStore.joinedProjects;
  const favoriteProjects = workspaceSlug && projectStore.favoriteProjects;

  const orderedJoinedProjects: IProject[] | undefined = joinedProjects
    ? orderArrayBy(joinedProjects, "sort_order", "ascending")
    : undefined;

  const orderedFavProjects: IProject[] | undefined = favoriteProjects
    ? orderArrayBy(favoriteProjects, "sort_order", "ascending")
    : undefined;

  const handleCopyText = (projectId: string) => {
    const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
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

    const updatedSortOrder = projectStore.orderProjectsWithSortOrder(source.index, destination.index, draggableId);

    projectStore
      .updateProjectView(workspaceSlug.toString(), draggableId, { sort_order: updatedSortOrder })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Something went wrong. Please try again.",
        });
      });
  };

  /**
   * Implementing scroll animation styles based on the scroll length of the container
   */
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        setIsScrolled(scrollTop > 0);
      }
    };
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
                        {!themeStore?.sidebarCollapsed && (
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
                                  <ProjectSidebarListItem
                                    key={project.id}
                                    project={project}
                                    sidebarCollapse={themeStore?.sidebarCollapsed || false}
                                    provided={provided}
                                    snapshot={snapshot}
                                    handleCopyText={() => handleCopyText(project.id)}
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
                        {!themeStore?.sidebarCollapsed && (
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
                                    <ProjectSidebarListItem
                                      key={project.id}
                                      project={project}
                                      sidebarCollapse={themeStore?.sidebarCollapsed || false}
                                      provided={provided}
                                      snapshot={snapshot}
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
            {!themeStore?.sidebarCollapsed && "Add Project"}
          </button>
        )}
      </div>
    </>
  );
});
