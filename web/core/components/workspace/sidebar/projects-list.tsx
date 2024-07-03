"use client";

import { useState, FC, useRef, useEffect } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Briefcase, ChevronRight, LucideIcon, Plus, Star } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// types
import { IProject } from "@plane/types";
// ui
import { TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
// components
import { CreateProjectModal } from "@/components/project";
import { SidebarProjectsListItem } from "@/components/workspace";
// constants
import { EUserWorkspaceRoles } from "@/constants/workspace";
// helpers
import { cn } from "@/helpers/common.helper";
import { orderJoinedProjects } from "@/helpers/project.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useAppTheme, useCommandPalette, useEventTracker, useProject, useUser } from "@/hooks/store";

export const SidebarProjectsList: FC = observer(() => {
  // get local storage data for isFavoriteProjectsListOpen and isAllProjectsListOpen
  const isFavProjectsListOpenInLocalStorage = localStorage.getItem("isFavoriteProjectsListOpen");
  const isAllProjectsListOpenInLocalStorage = localStorage.getItem("isAllProjectsListOpen");
  // states
  const [isFavoriteProjectsListOpen, setIsFavoriteProjectsListOpen] = useState(
    isFavProjectsListOpenInLocalStorage === "true"
  );
  const [isAllProjectsListOpen, setIsAllProjectsListOpen] = useState(isAllProjectsListOpenInLocalStorage === "true");
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
  // router params
  const { workspaceSlug } = useParams();
  // auth
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

  const handleOnProjectDrop = (
    sourceId: string | undefined,
    destinationId: string | undefined,
    shouldDropAtEnd: boolean
  ) => {
    if (!sourceId || !destinationId || !workspaceSlug) return;
    if (sourceId === destinationId) return;

    const joinedProjectsList: IProject[] = [];
    joinedProjects.map((projectId) => {
      const projectDetails = getProjectById(projectId);
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
  }, [containerRef]);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) return;

    return combine(
      autoScrollForElements({
        element,
        canScroll: ({ source }) => source?.data?.dragInstanceId === "PROJECTS",
        getAllowedAxis: () => "vertical",
      })
    );
  }, [containerRef]);

  const toggleListDisclosure = (isOpen: boolean, type: "all" | "favorite") => {
    if (type === "all") {
      setIsAllProjectsListOpen(isOpen);
      localStorage.setItem("isAllProjectsListOpen", isOpen.toString());
    } else {
      setIsFavoriteProjectsListOpen(isOpen);
      localStorage.setItem("isFavoriteProjectsListOpen", isOpen.toString());
    }
  };

  const projectSections: {
    key: "all" | "favorite";
    type: "FAVORITES" | "JOINED";
    title: string;
    icon: LucideIcon;
    projects: string[];
    isOpen: boolean;
  }[] = [
    {
      key: "favorite",
      type: "FAVORITES",
      title: "Favorites",
      icon: Star,
      projects: favoriteProjects,
      isOpen: isFavoriteProjectsListOpen,
    },
    {
      key: "all",
      type: "JOINED",
      title: "My projects",
      icon: Briefcase,
      projects: joinedProjects,
      isOpen: isAllProjectsListOpen,
    },
  ];

  return (
    <>
      {workspaceSlug && (
        <CreateProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          setToFavorite={isFavoriteProjectCreate}
          workspaceSlug={workspaceSlug.toString()}
        />
      )}
      <div
        ref={containerRef}
        className={cn("vertical-scrollbar h-full !overflow-y-scroll scrollbar-sm -mr-3 -ml-4 pl-4", {
          "border-t border-custom-sidebar-border-300": isScrolled,
        })}
      >
        {projectSections.map((section, index) => {
          if (!section.projects || section.projects.length === 0) return;

          return (
            <>
              <Disclosure key={section.title} as="div" className="flex flex-col" defaultOpen={section.isOpen}>
                <>
                  <div
                    className={cn(
                      "group w-full flex items-center justify-between px-2 py-1.5 rounded text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-90",
                      {
                        "p-0 justify-center w-fit mx-auto bg-custom-sidebar-background-90 hover:bg-custom-sidebar-background-80":
                          isCollapsed,
                      }
                    )}
                  >
                    <Disclosure.Button
                      as="button"
                      type="button"
                      className={cn(
                        "group w-full flex items-center gap-1 whitespace-nowrap text-left text-sm font-semibold text-custom-sidebar-text-400",
                        {
                          "!text-center w-8 px-2 py-1.5 justify-center": isCollapsed,
                        }
                      )}
                      onClick={() => toggleListDisclosure(!section.isOpen, section.key)}
                    >
                      <Tooltip
                        tooltipHeading={section.title}
                        tooltipContent=""
                        position="right"
                        disabled={!isCollapsed}
                      >
                        <span>{isCollapsed ? <section.icon className="flex-shrink-0 size-3" /> : section.title}</span>
                      </Tooltip>
                    </Disclosure.Button>
                    {!isCollapsed && (
                      <div className="flex items-center opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                        {isAuthorizedUser && (
                          <Tooltip tooltipHeading="Create project" tooltipContent="">
                            <button
                              type="button"
                              className="p-0.5 rounded hover:bg-custom-sidebar-background-80 flex-shrink-0"
                              onClick={() => {
                                setTrackElement(`APP_SIDEBAR_${section.type}_BLOCK`);
                                setIsFavoriteProjectCreate(section.key === "favorite");
                                setIsProjectModalOpen(true);
                              }}
                            >
                              <Plus className="size-3" />
                            </button>
                          </Tooltip>
                        )}
                        <Disclosure.Button
                          as="button"
                          type="button"
                          className="p-0.5 rounded hover:bg-custom-sidebar-background-80 flex-shrink-0"
                          onClick={() => toggleListDisclosure(!section.isOpen, section.key)}
                        >
                          <ChevronRight
                            className={cn("flex-shrink-0 size-4 transition-all", {
                              "rotate-90": section.isOpen,
                            })}
                          />
                        </Disclosure.Button>
                      </div>
                    )}
                  </div>
                  <Transition
                    show={section.isOpen}
                    enter="transition duration-100 ease-out"
                    enterFrom="transform scale-95 opacity-0"
                    enterTo="transform scale-100 opacity-100"
                    leave="transition duration-75 ease-out"
                    leaveFrom="transform scale-100 opacity-100"
                    leaveTo="transform scale-95 opacity-0"
                  >
                    {section.isOpen && (
                      <Disclosure.Panel
                        as="div"
                        className={cn("mt-2 ml-1 space-y-1", {
                          "space-y-0 ml-0": isCollapsed,
                        })}
                        static
                      >
                        {section.projects.map((projectId, index) => (
                          <SidebarProjectsListItem
                            key={projectId}
                            projectId={projectId}
                            handleCopyText={() => handleCopyText(projectId)}
                            projectListType={section.type}
                            disableDrag={section.key === "favorite"}
                            disableDrop={section.key === "favorite"}
                            isLastChild={index === section.projects.length - 1}
                            handleOnProjectDrop={handleOnProjectDrop}
                          />
                        ))}
                      </Disclosure.Panel>
                    )}
                  </Transition>
                </>
              </Disclosure>
              <hr
                className={cn("flex-shrink-0 border-custom-sidebar-border-300 h-[0.5px] w-3/5 mx-auto my-2", {
                  "opacity-0": !sidebarCollapsed,
                  hidden: index === projectSections.length - 1,
                })}
              />
            </>
          );
        })}
        {isAuthorizedUser && joinedProjects?.length === 0 && (
          <button
            type="button"
            className="w-full flex items-center gap-1.5 px-2 py-1.5 text-sm leading-5 font-medium text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-90 rounded-md"
            onClick={() => {
              setTrackElement("Sidebar");
              toggleCreateProjectModal(true);
            }}
          >
            <Plus className="flex-shrink-0 size-4" />
            {!isCollapsed && "Add project"}
          </button>
        )}
      </div>
    </>
  );
});
