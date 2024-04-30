import { useRef, useState } from "react";
import { DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { observer } from "mobx-react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  MoreVertical,
  PenSquare,
  LinkIcon,
  Star,
  FileText,
  Settings,
  Share2,
  LogOut,
  ChevronDown,
  MoreHorizontal,
  Inbox,
} from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// icons
// ui
import {
  CustomMenu,
  Tooltip,
  ArchiveIcon,
  PhotoFilterIcon,
  DiceIcon,
  ContrastIcon,
  LayersIcon,
  setPromiseToast,
} from "@plane/ui";
import { LeaveProjectModal, ProjectLogo, PublishProjectModal } from "@/components/project";
import { EUserProjectRoles } from "@/constants/project";
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme, useEventTracker, useProject } from "@/hooks/store";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";
import { usePlatformOS } from "@/hooks/use-platform-os";
// helpers

// components

type Props = {
  projectId: string;
  provided?: DraggableProvided;
  snapshot?: DraggableStateSnapshot;
  handleCopyText: () => void;
  shortContextMenu?: boolean;
  disableDrag?: boolean;
};

const navigation = (workspaceSlug: string, projectId: string) => [
  {
    name: "Issues",
    href: `/${workspaceSlug}/projects/${projectId}/issues`,
    Icon: LayersIcon,
  },
  {
    name: "Cycles",
    href: `/${workspaceSlug}/projects/${projectId}/cycles`,
    Icon: ContrastIcon,
  },
  {
    name: "Modules",
    href: `/${workspaceSlug}/projects/${projectId}/modules`,
    Icon: DiceIcon,
  },
  {
    name: "Views",
    href: `/${workspaceSlug}/projects/${projectId}/views`,
    Icon: PhotoFilterIcon,
  },
  {
    name: "Pages",
    href: `/${workspaceSlug}/projects/${projectId}/pages`,
    Icon: FileText,
  },
  {
    name: "Inbox",
    href: `/${workspaceSlug}/projects/${projectId}/inbox`,
    Icon: Inbox,
  },
  {
    name: "Settings",
    href: `/${workspaceSlug}/projects/${projectId}/settings`,
    Icon: Settings,
  },
];

export const ProjectSidebarListItem: React.FC<Props> = observer((props) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { projectId, provided, snapshot, handleCopyText, shortContextMenu = false, disableDrag } = props;
  // store hooks
  const { sidebarCollapsed: isCollapsed, toggleSidebar } = useAppTheme();
  const { setTrackElement } = useEventTracker();
  const { addProjectToFavorites, removeProjectFromFavorites, getProjectById } = useProject();
  const { isMobile } = usePlatformOS();
  // states
  const [leaveProjectModalOpen, setLeaveProjectModal] = useState(false);
  const [publishModalOpen, setPublishModal] = useState(false);
  const [isMenuActive, setIsMenuActive] = useState(false);
  // refs
  const actionSectionRef = useRef<HTMLDivElement | null>(null);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId: URLProjectId } = router.query;
  // derived values
  const project = getProjectById(projectId);
  // auth
  const isAdmin = project?.member_role === EUserProjectRoles.ADMIN;
  const isViewerOrGuest =
    project?.member_role && [EUserProjectRoles.VIEWER, EUserProjectRoles.GUEST].includes(project.member_role);

  const handleAddToFavorites = () => {
    if (!workspaceSlug || !project) return;

    const addToFavoritePromise = addProjectToFavorites(workspaceSlug.toString(), project.id);
    setPromiseToast(addToFavoritePromise, {
      loading: "Adding project to favorites...",
      success: {
        title: "Success!",
        message: () => "Project added to favorites.",
      },
      error: {
        title: "Error!",
        message: () => "Couldn't add the project to favorites. Please try again.",
      },
    });
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !project) return;

    const removeFromFavoritePromise = removeProjectFromFavorites(workspaceSlug.toString(), project.id);
    setPromiseToast(removeFromFavoritePromise, {
      loading: "Removing project from favorites...",
      success: {
        title: "Success!",
        message: () => "Project removed from favorites.",
      },
      error: {
        title: "Error!",
        message: () => "Couldn't remove the project from favorites. Please try again.",
      },
    });
  };

  const handleLeaveProject = () => {
    setTrackElement("APP_SIDEBAR_PROJECT_DROPDOWN");
    setLeaveProjectModal(true);
  };

  const handleLeaveProjectModalClose = () => {
    setLeaveProjectModal(false);
  };

  const handleProjectClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  useOutsideClickDetector(actionSectionRef, () => setIsMenuActive(false));

  if (!project) return null;

  return (
    <>
      <PublishProjectModal isOpen={publishModalOpen} project={project} onClose={() => setPublishModal(false)} />
      <LeaveProjectModal project={project} isOpen={leaveProjectModalOpen} onClose={handleLeaveProjectModalClose} />
      <Disclosure key={`${project.id} ${URLProjectId}`} defaultOpen={URLProjectId === project.id}>
        {({ open }) => (
          <>
            <div
              className={cn(
                "group relative flex w-full items-center rounded-md px-2 py-1 text-custom-sidebar-text-100 hover:bg-custom-sidebar-background-80",
                {
                  "opacity-60": snapshot?.isDragging,
                  "bg-custom-sidebar-background-80": isMenuActive,
                }
              )}
            >
              {provided && !disableDrag && (
                <Tooltip
                  isMobile={isMobile}
                  tooltipContent={project.sort_order === null ? "Join the project to rearrange" : "Drag to rearrange"}
                  position="top-right"
                >
                  <button
                    type="button"
                    className={cn(
                      "absolute -left-2.5 top-1/2 hidden -translate-y-1/2 rounded p-0.5 text-custom-sidebar-text-400",
                      {
                        "group-hover:flex": !isCollapsed,
                        "cursor-not-allowed opacity-60": project.sort_order === null,
                        flex: isMenuActive,
                      }
                    )}
                    {...provided?.dragHandleProps}
                  >
                    <MoreVertical className="h-3.5" />
                    <MoreVertical className="-ml-5 h-3.5" />
                  </button>
                </Tooltip>
              )}
              <Tooltip
                tooltipContent={`${project.name}`}
                position="right"
                className="ml-2"
                disabled={!isCollapsed}
                isMobile={isMobile}
              >
                <Disclosure.Button
                  as="div"
                  className={cn(
                    "flex flex-grow cursor-pointer select-none items-center justify-between truncate text-left text-sm font-medium",
                    {
                      "justify-center": isCollapsed,
                    }
                  )}
                >
                  <div
                    className={cn("flex w-full flex-grow items-center gap-1 truncate", {
                      "justify-center": isCollapsed,
                    })}
                  >
                    <div className="h-7 w-7 grid place-items-center flex-shrink-0">
                      <ProjectLogo logo={project.logo_props} />
                    </div>
                    {!isCollapsed && <p className="truncate text-custom-sidebar-text-200">{project.name}</p>}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown
                      className={cn(
                        "mb-0.5 hidden h-4 w-4 flex-shrink-0 text-custom-sidebar-text-400 duration-300 group-hover:block",
                        {
                          "rotate-180": open,
                          block: isMenuActive,
                        }
                      )}
                    />
                  )}
                </Disclosure.Button>
              </Tooltip>

              {!isCollapsed && (
                <CustomMenu
                  customButton={
                    <div
                      ref={actionSectionRef}
                      className="my-auto mt-1.5 w-full cursor-pointer px-1 text-custom-sidebar-text-400 duration-300"
                      onClick={() => setIsMenuActive(!isMenuActive)}
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </div>
                  }
                  className={cn("hidden flex-shrink-0 group-hover:block", {
                    "!block": isMenuActive,
                  })}
                  buttonClassName="!text-custom-sidebar-text-400"
                  ellipsis
                  placement="bottom-start"
                >
                  {!project.is_favorite && (
                    <CustomMenu.MenuItem onClick={handleAddToFavorites}>
                      <span className="flex items-center justify-start gap-2">
                        <Star className="h-3.5 w-3.5 stroke-[1.5]" />
                        <span>Add to favorites</span>
                      </span>
                    </CustomMenu.MenuItem>
                  )}
                  {project.is_favorite && (
                    <CustomMenu.MenuItem onClick={handleRemoveFromFavorites}>
                      <span className="flex items-center justify-start gap-2">
                        <Star className="h-3.5 w-3.5 fill-yellow-500 stroke-yellow-500" />
                        <span>Remove from favorites</span>
                      </span>
                    </CustomMenu.MenuItem>
                  )}
                  {/* publish project settings */}
                  {isAdmin && (
                    <CustomMenu.MenuItem onClick={() => setPublishModal(true)}>
                      <div className="relative flex flex-shrink-0 items-center justify-start gap-2">
                        <div className="flex h-4 w-4 cursor-pointer items-center justify-center rounded text-custom-sidebar-text-200 transition-all duration-300 hover:bg-custom-sidebar-background-80">
                          <Share2 className="h-3.5 w-3.5 stroke-[1.5]" />
                        </div>
                        <div>{project.is_deployed ? "Publish settings" : "Publish"}</div>
                      </div>
                    </CustomMenu.MenuItem>
                  )}
                  <CustomMenu.MenuItem>
                    <Link href={`/${workspaceSlug}/projects/${project?.id}/draft-issues/`}>
                      <div className="flex items-center justify-start gap-2">
                        <PenSquare className="h-3.5 w-3.5 stroke-[1.5] text-custom-text-300" />
                        <span>Draft issues</span>
                      </div>
                    </Link>
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem onClick={handleCopyText}>
                    <span className="flex items-center justify-start gap-2">
                      <LinkIcon className="h-3.5 w-3.5 stroke-[1.5]" />
                      <span>Copy link</span>
                    </span>
                  </CustomMenu.MenuItem>

                  {!isViewerOrGuest && (
                    <CustomMenu.MenuItem>
                      <Link href={`/${workspaceSlug}/projects/${project?.id}/archives/issues`}>
                        <div className="flex items-center justify-start gap-2">
                          <ArchiveIcon className="h-3.5 w-3.5 stroke-[1.5]" />
                          <span>Archives</span>
                        </div>
                      </Link>
                    </CustomMenu.MenuItem>
                  )}
                  <CustomMenu.MenuItem>
                    <Link href={`/${workspaceSlug}/projects/${project?.id}/settings`}>
                      <div className="flex items-center justify-start gap-2">
                        <Settings className="h-3.5 w-3.5 stroke-[1.5]" />
                        <span>Settings</span>
                      </div>
                    </Link>
                  </CustomMenu.MenuItem>
                  {/* leave project */}
                  {isViewerOrGuest && (
                    <CustomMenu.MenuItem onClick={handleLeaveProject}>
                      <div className="flex items-center justify-start gap-2">
                        <LogOut className="h-3.5 w-3.5 stroke-[1.5]" />
                        <span>Leave project</span>
                      </div>
                    </CustomMenu.MenuItem>
                  )}
                </CustomMenu>
              )}
            </div>

            <Transition
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <Disclosure.Panel className={`mt-1 space-y-1 ${isCollapsed ? "" : "ml-[2.25rem]"}`}>
                {navigation(workspaceSlug as string, project?.id).map((item) => {
                  if (
                    (item.name === "Cycles" && !project.cycle_view) ||
                    (item.name === "Modules" && !project.module_view) ||
                    (item.name === "Views" && !project.issue_views_view) ||
                    (item.name === "Pages" && !project.page_view) ||
                    (item.name === "Inbox" && !project.inbox_view)
                  )
                    return;

                  return (
                    <Link key={item.name} href={item.href} onClick={handleProjectClick}>
                      <span className="block w-full">
                        <Tooltip
                          isMobile={isMobile}
                          tooltipContent={`${project?.name}: ${item.name}`}
                          position="right"
                          className="ml-2"
                          disabled={!isCollapsed}
                        >
                          <div
                            className={`group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs font-medium outline-none ${
                              router.asPath.includes(item.href)
                                ? "bg-custom-primary-100/10 text-custom-primary-100"
                                : "text-custom-sidebar-text-300 hover:bg-custom-sidebar-background-80 focus:bg-custom-sidebar-background-80"
                            } ${isCollapsed ? "justify-center" : ""}`}
                          >
                            <item.Icon className="h-4 w-4 stroke-[1.5]" />
                            {!isCollapsed && item.name}
                          </div>
                        </Tooltip>
                      </span>
                    </Link>
                  );
                })}
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>
    </>
  );
});
