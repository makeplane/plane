import { useState, useRef, useEffect } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { Ellipsis } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, PROJECT_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { PlusIcon, ChevronRightIcon } from "@plane/propel/icons";
import { IconButton } from "@plane/propel/icon-button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { Loader } from "@plane/ui";
import { copyUrlToClipboard, cn, orderJoinedProjects } from "@plane/utils";
// components
import { CreateProjectModal } from "@/components/project/create-project-modal";
import { SidebarNavItem } from "@/components/sidebar/sidebar-navigation";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useProjectNavigationPreferences } from "@/hooks/use-navigation-preferences";
// plane web imports
import type { TProject } from "@/plane-web/types";
// local imports
import { SidebarProjectsListItem } from "./projects-list-item";

export const SidebarProjectsList = observer(function SidebarProjectsList() {
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
  const { preferences: projectPreferences } = useProjectNavigationPreferences();
  const { isExtendedProjectSidebarOpened, toggleExtendedProjectSidebar } = useAppTheme();

  const { loader, getPartialProjectById, joinedProjectIds: joinedProjects, updateProjectView } = useProject();
  // router params
  const { workspaceSlug } = useParams();
  const pathname = usePathname();

  // auth
  const isAuthorizedUser = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  // Compute limited projects for main sidebar
  const displayedProjects = projectPreferences.showLimitedProjects
    ? joinedProjects.slice(0, projectPreferences.limitedProjectsCount)
    : joinedProjects;

  // Check if there are more projects to show
  const hasMoreProjects =
    projectPreferences.showLimitedProjects && joinedProjects.length > projectPreferences.limitedProjectsCount;

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
          "border-t border-strong": isScrolled,
        })}
      >
        <>
          <Disclosure as="div" className="flex flex-col" defaultOpen={isAllProjectsListOpen}>
            <div className="group w-full flex items-center justify-between px-2 py-1.5 rounded-sm text-placeholder hover:bg-layer-transparent-hover">
              <Disclosure.Button
                as="button"
                type="button"
                className="w-full flex items-center gap-1 whitespace-nowrap text-left text-13 font-semibold text-placeholder"
                onClick={() => toggleListDisclosure(!isAllProjectsListOpen)}
                aria-label={t(
                  isAllProjectsListOpen
                    ? "aria_labels.projects_sidebar.close_projects_menu"
                    : "aria_labels.projects_sidebar.open_projects_menu"
                )}
              >
                <span className="text-13 font-semibold">{t("projects")}</span>
              </Disclosure.Button>
              <div className="flex items-center gap-1">
                {isAuthorizedUser && (
                  <Tooltip tooltipHeading={t("create_project")} tooltipContent="">
                    <IconButton
                      variant="ghost"
                      size="sm"
                      icon={PlusIcon}
                      onClick={() => {
                        setIsProjectModalOpen(true);
                      }}
                      data-ph-element={PROJECT_TRACKER_ELEMENTS.SIDEBAR_CREATE_PROJECT_TOOLTIP}
                      className="hidden group-hover:inline-flex text-placeholder"
                      aria-label={t("aria_labels.projects_sidebar.create_new_project")}
                    />
                  </Tooltip>
                )}
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={ChevronRightIcon}
                  onClick={() => toggleListDisclosure(!isAllProjectsListOpen)}
                  className="text-placeholder"
                  iconClassName={cn("transition-transform", {
                    "rotate-90": isAllProjectsListOpen,
                  })}
                  aria-label={t(
                    isAllProjectsListOpen
                      ? "aria_labels.projects_sidebar.close_projects_menu"
                      : "aria_labels.projects_sidebar.open_projects_menu"
                  )}
                />
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
                    {displayedProjects.map((projectId, index) => (
                      <SidebarProjectsListItem
                        key={projectId}
                        projectId={projectId}
                        handleCopyText={() => handleCopyText(projectId)}
                        projectListType={"JOINED"}
                        disableDrag={false}
                        disableDrop={false}
                        isLastChild={index === displayedProjects.length - 1}
                        handleOnProjectDrop={handleOnProjectDrop}
                      />
                    ))}
                    {hasMoreProjects && (
                      <SidebarNavItem>
                        <button
                          type="button"
                          onClick={() => toggleExtendedProjectSidebar()}
                          className="flex items-center gap-1.5 text-13 font-medium flex-grow text-tertiary"
                          id="extended-project-sidebar-toggle"
                          aria-label={t(
                            isExtendedProjectSidebarOpened
                              ? "aria_labels.app_sidebar.close_extended_sidebar"
                              : "aria_labels.app_sidebar.open_extended_sidebar"
                          )}
                        >
                          <Ellipsis className="flex-shrink-0 size-4" />
                          <span>{isExtendedProjectSidebarOpened ? "Hide" : "More"}</span>
                        </button>
                      </SidebarNavItem>
                    )}
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
            className="w-full flex items-center gap-1.5 px-2 py-1.5 text-13 leading-5 font-medium text-secondary hover:bg-surface-2 rounded-md"
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
