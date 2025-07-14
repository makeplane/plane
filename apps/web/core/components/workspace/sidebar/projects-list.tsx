"use client";

import { useState, FC, useRef, useEffect } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
import { EUserPermissions, EUserPermissionsLevel, PROJECT_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// ui
import { Loader, TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
import { copyUrlToClipboard, cn, orderJoinedProjects } from "@plane/utils";
// components
import { CreateProjectModal } from "@/components/project";
import { SidebarProjectsListItem } from "@/components/workspace";
// helpers
// hooks
import { useCommandPalette, useProject, useUserPermissions } from "@/hooks/store";
// plane web types
import { TProject } from "@/plane-web/types";

export const SidebarProjectsList: FC = observer(() => {
  // states

  const [isAllProjectsListOpen, setIsAllProjectsListOpen] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // scroll animation state
  // refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  // store hooks
  const { t } = useTranslation();
  const { toggleCreateProjectModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();

  const { loader, getPartialProjectById, joinedProjectIds: joinedProjects, updateProjectView } = useProject();
  // router params
  const { workspaceSlug } = useParams();
  const pathname = usePathname();

  // auth
  const isAuthorizedUser = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const handleCopyText = (projectId: string) => {
    copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/issues`).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("link_copied"),
        message: t("project_link_copied_to_clipboard"),
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

  const toggleListDisclosure = (isOpen: boolean) => {
    setIsAllProjectsListOpen(isOpen);
    localStorage.setItem("isAllProjectsListOpen", isOpen.toString());
  };
  useEffect(() => {
    if (pathname.includes("projects")) {
      setIsAllProjectsListOpen(true);
      localStorage.setItem("isAllProjectsListOpen", "true");
    }
  }, [pathname]);
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
      <div
        ref={containerRef}
        className={cn({
          "border-t border-custom-sidebar-border-300": isScrolled,
        })}
      >
        <>
          <Disclosure as="div" className="flex flex-col" defaultOpen={isAllProjectsListOpen}>
            <div className="group w-full flex items-center justify-between px-2 py-1.5 rounded text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-90">
              <Disclosure.Button
                as="button"
                type="button"
                className="w-full flex items-center gap-1 whitespace-nowrap text-left text-sm font-semibold text-custom-sidebar-text-400"
                onClick={() => toggleListDisclosure(!isAllProjectsListOpen)}
                aria-label={t(
                  isAllProjectsListOpen
                    ? "aria_labels.projects_sidebar.close_projects_menu"
                    : "aria_labels.projects_sidebar.open_projects_menu"
                )}
              >
                <span className="text-sm font-semibold">{t("projects")}</span>
              </Disclosure.Button>
              <div className="flex items-center opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                {isAuthorizedUser && (
                  <Tooltip tooltipHeading={t("create_project")} tooltipContent="">
                    <button
                      type="button"
                      data-ph-element={PROJECT_TRACKER_ELEMENTS.SIDEBAR_CREATE_PROJECT_TOOLTIP}
                      className="p-0.5 rounded hover:bg-custom-sidebar-background-80 flex-shrink-0"
                      onClick={() => {
                        setIsProjectModalOpen(true);
                      }}
                      aria-label={t("aria_labels.projects_sidebar.create_new_project")}
                    >
                      <Plus className="size-3" />
                    </button>
                  </Tooltip>
                )}
                <Disclosure.Button
                  as="button"
                  type="button"
                  className="p-0.5 rounded hover:bg-custom-sidebar-background-80 flex-shrink-0"
                  onClick={() => toggleListDisclosure(!isAllProjectsListOpen)}
                  aria-label={t(
                    isAllProjectsListOpen
                      ? "aria_labels.projects_sidebar.close_projects_menu"
                      : "aria_labels.projects_sidebar.open_projects_menu"
                  )}
                >
                  <ChevronRight
                    className={cn("flex-shrink-0 size-3 transition-all", {
                      "rotate-90": isAllProjectsListOpen,
                    })}
                  />
                </Disclosure.Button>
              </div>
            </div>
            <Transition
              show={isAllProjectsListOpen}
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              {loader === "init-loader" && (
                <Loader className="w-full space-y-1.5">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Loader.Item key={index} height="28px" />
                  ))}
                </Loader>
              )}
              {isAllProjectsListOpen && (
                <Disclosure.Panel as="div" className="flex flex-col gap-0.5" static>
                  <>
                    {joinedProjects.map((projectId, index) => (
                      <SidebarProjectsListItem
                        key={projectId}
                        projectId={projectId}
                        handleCopyText={() => handleCopyText(projectId)}
                        projectListType={"JOINED"}
                        disableDrag={false}
                        disableDrop={false}
                        isLastChild={index === joinedProjects.length - 1}
                        handleOnProjectDrop={handleOnProjectDrop}
                      />
                    ))}
                  </>
                </Disclosure.Panel>
              )}
            </Transition>
          </Disclosure>
        </>

        {isAuthorizedUser && joinedProjects?.length === 0 && (
          <button
            type="button"
            data-ph-element={PROJECT_TRACKER_ELEMENTS.SIDEBAR_CREATE_PROJECT_BUTTON}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 text-sm leading-5 font-medium text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-90 rounded-md"
            onClick={() => {
              toggleCreateProjectModal(true);
            }}
          >
            {t("add_project")}
          </button>
        )}
      </div>
    </>
  );
});
