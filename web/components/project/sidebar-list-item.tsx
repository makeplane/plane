import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { Disclosure, Transition } from "@headlessui/react";
import { observer } from "mobx-react-lite";
// icons
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
} from "lucide-react";
// hooks
import { useApplication, useProject } from "hooks/store";
import useOutsideClickDetector from "hooks/use-outside-click-detector";
import useToast from "hooks/use-toast";
// helpers
import { renderEmoji } from "helpers/emoji.helper";
// components
import { CustomMenu, Tooltip, ArchiveIcon, PhotoFilterIcon, DiceIcon, ContrastIcon, LayersIcon } from "@plane/ui";
import { LeaveProjectModal, PublishProjectModal } from "components/project";
import { EUserProjectRoles } from "constants/project";

type Props = {
  projectId: string;
  provided?: DraggableProvided;
  snapshot?: DraggableStateSnapshot;
  handleCopyText: () => void;
  shortContextMenu?: boolean;
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
    name: "Settings",
    href: `/${workspaceSlug}/projects/${projectId}/settings`,
    Icon: Settings,
  },
];

export const ProjectSidebarListItem: React.FC<Props> = observer((props) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { projectId, provided, snapshot, handleCopyText, shortContextMenu = false } = props;
  // store hooks
  const {
    theme: themeStore,
    eventTracker: { setTrackElement },
  } = useApplication();
  const { addProjectToFavorites, removeProjectFromFavorites, getProjectById } = useProject();
  // states
  const [leaveProjectModalOpen, setLeaveProjectModal] = useState(false);
  const [publishModalOpen, setPublishModal] = useState(false);
  const [isMenuActive, setIsMenuActive] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId: URLProjectId } = router.query;
  // toast alert
  const { setToastAlert } = useToast();
  // derived values
  const project = getProjectById(projectId);

  const isAdmin = project?.member_role === EUserProjectRoles.ADMIN;
  const isViewerOrGuest =
    project?.member_role && [EUserProjectRoles.VIEWER, EUserProjectRoles.GUEST].includes(project.member_role);

  const isCollapsed = themeStore.sidebarCollapsed;

  const actionSectionRef = useRef<HTMLDivElement | null>(null);

  const handleAddToFavorites = () => {
    if (!workspaceSlug || !project) return;

    addProjectToFavorites(workspaceSlug.toString(), project.id).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Couldn't remove the project from favorites. Please try again.",
      });
    });
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !project) return;

    removeProjectFromFavorites(workspaceSlug.toString(), project.id).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Couldn't remove the project from favorites. Please try again.",
      });
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
      themeStore.toggleSidebar();
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
              className={`group relative flex w-full items-center rounded-md px-2 py-1 text-custom-sidebar-text-10 hover:bg-custom-sidebar-background-80 ${snapshot?.isDragging ? "opacity-60" : ""
                } ${isMenuActive ? "!bg-custom-sidebar-background-80" : ""}`}
            >
              {provided && (
                <Tooltip
                  tooltipContent={project.sort_order === null ? "Join the project to rearrange" : "Drag to rearrange"}
                  position="top-right"
                >
                  <button
                    type="button"
                    className={`absolute -left-2.5 top-1/2 hidden -translate-y-1/2 rounded p-0.5 text-custom-sidebar-text-400 ${isCollapsed ? "" : "group-hover:!flex"
                      } ${project.sort_order === null ? "cursor-not-allowed opacity-60" : ""} ${isMenuActive ? "!flex" : ""
                      }`}
                    {...provided?.dragHandleProps}
                  >
                    <MoreVertical className="h-3.5" />
                    <MoreVertical className="-ml-5 h-3.5" />
                  </button>
                </Tooltip>
              )}
              <Tooltip tooltipContent={`${project.name}`} position="right" className="ml-2" disabled={!isCollapsed}>
                <Disclosure.Button
                  as="div"
                  className={`flex flex-grow cursor-pointer select-none items-center truncate text-left text-sm font-medium ${isCollapsed ? "justify-center" : `justify-between`
                    }`}
                >
                  <div
                    className={`flex w-full flex-grow items-center gap-x-2 truncate ${isCollapsed ? "justify-center" : ""
                      }`}
                  >
                    {project.emoji ? (
                      <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
                        {renderEmoji(project.emoji)}
                      </span>
                    ) : project.icon_prop ? (
                      <div className="grid h-7 w-7 flex-shrink-0 place-items-center">
                        {renderEmoji(project.icon_prop)}
                      </div>
                    ) : (
                      <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                        {project?.name.charAt(0)}
                      </span>
                    )}

                    {!isCollapsed && <p className="truncate text-custom-sidebar-text-200">{project.name}</p>}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown
                      className={`hidden h-4 w-4 flex-shrink-0 ${open ? "rotate-180" : ""} ${isMenuActive ? "!block" : ""
                        }  mb-0.5 text-custom-sidebar-text-400 duration-300 group-hover:!block`}
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
                  className={`hidden flex-shrink-0 group-hover:block ${isMenuActive ? "!block" : ""}`}
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
                        <Star className="h-3.5 w-3.5 fill-orange-400 stroke-[1.5] text-orange-400" />
                        <span>Remove from favorites</span>
                      </span>
                    </CustomMenu.MenuItem>
                  )}
                  <CustomMenu.MenuItem onClick={handleCopyText}>
                    <span className="flex items-center justify-start gap-2">
                      <LinkIcon className="h-3.5 w-3.5 stroke-[1.5]" />
                      <span>Copy project link</span>
                    </span>
                  </CustomMenu.MenuItem>

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

                  {project.archive_in > 0 && (
                    <CustomMenu.MenuItem>
                      <Link href={`/${workspaceSlug}/projects/${project?.id}/archived-issues/`}>
                        <div className="flex items-center justify-start gap-2">
                          <ArchiveIcon className="h-3.5 w-3.5 stroke-[1.5]" />
                          <span>Archived Issues</span>
                        </div>
                      </Link>
                    </CustomMenu.MenuItem>
                  )}
                  <CustomMenu.MenuItem>
                    <Link href={`/${workspaceSlug}/projects/${project?.id}/draft-issues/`}>
                      <div className="flex items-center justify-start gap-2">
                        <PenSquare className="h-3.5 w-3.5 stroke-[1.5] text-custom-text-300" />
                        <span>Draft Issues</span>
                      </div>
                    </Link>
                  </CustomMenu.MenuItem>
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
                    (item.name === "Pages" && !project.page_view)
                  )
                    return;

                  return (
                    <Link key={item.name} href={item.href} onClick={handleProjectClick}>
                      <span className="block w-full">
                        <Tooltip
                          tooltipContent={`${project?.name}: ${item.name}`}
                          position="right"
                          className="ml-2"
                          disabled={!isCollapsed}
                        >
                          <div
                            className={`group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs font-medium outline-none ${router.asPath.includes(item.href)
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
