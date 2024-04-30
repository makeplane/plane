import { useState, FC, useRef, useEffect } from "react";
import { DragDropContext, Draggable, DropResult, Droppable } from "@hello-pangea/dnd";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
import { IProject } from "@plane/types";
// hooks
import { TOAST_TYPE, setToast } from "@plane/ui";
import { CreateProjectModal, ProjectSidebarListItem } from "@/components/project";
import { EUserWorkspaceRoles } from "@/constants/workspace";
import { cn } from "@/helpers/common.helper";
import { orderJoinedProjects } from "@/helpers/project.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
import { useAppTheme, useCommandPalette, useEventTracker, useProject, useUser } from "@/hooks/store";
// ui
// components
// helpers
// constants

export const ProjectSidebarList: FC = observer(() => {
  // states
  const [isFavoriteProjectCreate, setIsFavoriteProjectCreate] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // scroll animation state
  // refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  // store hooks
  const { toggleCreateProjectModal } = useCommandPalette();
  const { sidebarCollapsed } = useAppTheme();
  const { setTrackElement } = useEventTracker();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  const {
    getProjectById,
    joinedProjectIds: joinedProjects,
    favoriteProjectIds: favoriteProjects,
    updateProjectView,
  } = useProject();
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const isAuthorizedUser = !!currentWorkspaceRole && currentWorkspaceRole >= EUserWorkspaceRoles.MEMBER;

  const handleCopyText = (projectId: string) => {
    copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/issues`).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "Project link copied to clipboard.",
      });
    });
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination || !workspaceSlug) return;
    if (source.index === destination.index) return;

    const joinedProjectsList: IProject[] = [];
    joinedProjects.map((projectId) => {
      const projectDetails = getProjectById(projectId);
      if (projectDetails) joinedProjectsList.push(projectDetails);
    });
    if (joinedProjectsList.length <= 0) return;

    const updatedSortOrder = orderJoinedProjects(source.index, destination.index, draggableId, joinedProjectsList);
    if (updatedSortOrder != undefined)
      updateProjectView(workspaceSlug.toString(), draggableId, { sort_order: updatedSortOrder }).catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong. Please try again.",
        });
      });
  };

  const isCollapsed = sidebarCollapsed || false;

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
      {workspaceSlug && (
        <CreateProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => {
            setIsProjectModalOpen(false);
          }}
          setToFavorite={isFavoriteProjectCreate}
          workspaceSlug={workspaceSlug.toString()}
        />
      )}
      <div
        ref={containerRef}
        className={cn(
          "vertical-scrollbar h-full space-y-2 !overflow-y-scroll pl-4",
          isCollapsed ? "scrollbar-sm" : "scrollbar-md",
          {
            "border-t border-custom-sidebar-border-300": isScrolled,
            "pr-1": !isCollapsed,
          }
        )}
      >
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="favorite-projects">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {favoriteProjects && favoriteProjects.length > 0 && (
                  <Disclosure as="div" className="flex flex-col" defaultOpen>
                    {({ open }) => (
                      <>
                        {!isCollapsed && (
                          <div className="group flex w-full items-center justify-between rounded p-1.5 text-xs text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-80">
                            <Disclosure.Button
                              as="button"
                              type="button"
                              className="group flex w-full items-center gap-1 whitespace-nowrap rounded px-1.5 text-left text-sm font-semibold text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-80"
                            >
                              Favorites
                              {open ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </Disclosure.Button>
                            {isAuthorizedUser && (
                              <button
                                className="opacity-0 group-hover:opacity-100"
                                onClick={() => {
                                  setTrackElement("APP_SIDEBAR_FAVORITES_BLOCK");
                                  setIsFavoriteProjectCreate(true);
                                  setIsProjectModalOpen(true);
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            )}
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
                            {favoriteProjects.map((projectId, index) => (
                              <Draggable
                                key={projectId}
                                draggableId={projectId}
                                index={index}
                                // FIXME refactor the Draggable to a different component
                                //isDragDisabled={!project.is_member}
                              >
                                {(provided, snapshot) => (
                                  <div ref={provided.innerRef} {...provided.draggableProps}>
                                    <ProjectSidebarListItem
                                      key={projectId}
                                      projectId={projectId}
                                      provided={provided}
                                      snapshot={snapshot}
                                      handleCopyText={() => handleCopyText(projectId)}
                                      shortContextMenu
                                      disableDrag
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
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="joined-projects">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {joinedProjects && joinedProjects.length > 0 && (
                  <Disclosure as="div" className="flex flex-col" defaultOpen>
                    {({ open }) => (
                      <>
                        {!isCollapsed && (
                          <div className="group flex w-full items-center justify-between rounded p-1.5 text-xs text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-80">
                            <Disclosure.Button
                              as="button"
                              type="button"
                              className="group flex w-full items-center gap-1 whitespace-nowrap rounded px-1.5 text-left text-sm font-semibold text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-80"
                            >
                              Your projects
                              {open ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </Disclosure.Button>
                            {isAuthorizedUser && (
                              <button
                                className="opacity-0 group-hover:opacity-100"
                                onClick={() => {
                                  setTrackElement("Sidebar");
                                  setIsFavoriteProjectCreate(false);
                                  setIsProjectModalOpen(true);
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            )}
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
                            {joinedProjects.map((projectId, index) => (
                              <Draggable key={projectId} draggableId={projectId} index={index}>
                                {(provided, snapshot) => (
                                  <div ref={provided.innerRef} {...provided.draggableProps}>
                                    <ProjectSidebarListItem
                                      key={projectId}
                                      projectId={projectId}
                                      provided={provided}
                                      snapshot={snapshot}
                                      handleCopyText={() => handleCopyText(projectId)}
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

        {isAuthorizedUser && joinedProjects && joinedProjects.length === 0 && (
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 text-sm text-custom-sidebar-text-200"
            onClick={() => {
              setTrackElement("Sidebar");
              toggleCreateProjectModal(true);
            }}
          >
            <Plus className="h-5 w-5" />
            {!isCollapsed && "Add Project"}
          </button>
        )}
      </div>
    </>
  );
});
