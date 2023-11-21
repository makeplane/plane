import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { Disclosure, Transition } from "@headlessui/react";
import { observer } from "mobx-react-lite";
// icons
import { MoreVertical, PenSquare, LinkIcon, Star, FileText, Settings, Share2, LogOut, ChevronDown } from "lucide-react";
// hooks
import useToast from "hooks/use-toast";
// helpers
import { renderEmoji } from "helpers/emoji.helper";
// types
import { IProject } from "types";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CustomMenu, Tooltip, ArchiveIcon, PhotoFilterIcon, DiceIcon, ContrastIcon, LayersIcon } from "@plane/ui";
import { LeaveProjectModal, PublishProjectModal } from "components/project";

type Props = {
  project: IProject;
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
  const { project, provided, snapshot, handleCopyText, shortContextMenu = false } = props;
  // store
  const { project: projectStore, theme: themeStore } = useMobxStore();
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // toast
  const { setToastAlert } = useToast();
  // states
  const [leaveProjectModalOpen, setLeaveProjectModal] = useState(false);
  const [publishModalOpen, setPublishModal] = useState(false);

  const isAdmin = project.member_role === 20;
  const isViewerOrGuest = project.member_role === 10 || project.member_role === 5;

  const isCollapsed = themeStore.sidebarCollapsed;

  const handleAddToFavorites = () => {
    if (!workspaceSlug) return;

    projectStore.addProjectToFavorites(workspaceSlug.toString(), project.id).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Couldn't remove the project from favorites. Please try again.",
      });
    });
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug) return;

    projectStore.removeProjectFromFavorites(workspaceSlug.toString(), project.id).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Couldn't remove the project from favorites. Please try again.",
      });
    });
  };

  const handleLeaveProject = () => {
    setLeaveProjectModal(true);
  };

  const handleLeaveProjectModalClose = () => {
    setLeaveProjectModal(false);
  };

  return (
    <>
      <PublishProjectModal isOpen={publishModalOpen} project={project} onClose={() => setPublishModal(false)} />
      <LeaveProjectModal project={project} isOpen={leaveProjectModalOpen} onClose={handleLeaveProjectModalClose} />
      <Disclosure key={`${project.id} ${projectId}`} defaultOpen={projectId === project.id}>
        {({ open }) => (
          <>
            <div
              className={`group relative text-custom-sidebar-text-10 px-2 py-1 w-full flex items-center hover:bg-custom-sidebar-background-80 rounded-md ${
                snapshot?.isDragging ? "opacity-60" : ""
              }`}
            >
              {provided && (
                <Tooltip
                  tooltipContent={project.sort_order === null ? "Join the project to rearrange" : "Drag to rearrange"}
                  position="top-right"
                >
                  <button
                    type="button"
                    className={`absolute top-1/2 -translate-y-1/2 -left-2.5 hidden rounded p-0.5 text-custom-sidebar-text-400 ${
                      isCollapsed ? "" : "group-hover:!flex"
                    } ${project.sort_order === null ? "opacity-60 cursor-not-allowed" : ""}`}
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
                  className={`flex items-center flex-grow truncate cursor-pointer select-none text-left text-sm font-medium ${
                    isCollapsed ? "justify-center" : `justify-between`
                  }`}
                >
                  <div
                    className={`flex items-center flex-grow w-full truncate gap-x-2 ${
                      isCollapsed ? "justify-center" : ""
                    }`}
                  >
                    {project.emoji ? (
                      <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
                        {renderEmoji(project.emoji)}
                      </span>
                    ) : project.icon_prop ? (
                      <div className="h-7 w-7 flex-shrink-0 grid place-items-center">
                        {renderEmoji(project.icon_prop)}
                      </div>
                    ) : (
                      <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                        {project?.name.charAt(0)}
                      </span>
                    )}

                    {!isCollapsed && <p className={`truncate text-custom-sidebar-text-200`}>{project.name}</p>}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown
                      className={`h-4 w-4 flex-shrink-0 ${
                        open ? "rotate-180" : ""
                      } !hidden group-hover:!block text-custom-sidebar-text-400 duration-300`}
                    />
                  )}
                </Disclosure.Button>
              </Tooltip>

              {!isCollapsed && (
                <CustomMenu
                  className="hidden group-hover:block flex-shrink-0"
                  buttonClassName="!text-custom-sidebar-text-400 hover:text-custom-sidebar-text-400"
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
                        <Star className="h-3.5 w-3.5 stroke-[1.5] text-orange-400 fill-orange-400" />
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
                      <div className="flex-shrink-0 relative flex items-center justify-start gap-2">
                        <div className="rounded transition-all w-4 h-4 flex justify-center items-center text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 duration-300 cursor-pointer">
                          <Share2 className="h-3.5 w-3.5 stroke-[1.5]" />
                        </div>
                        <div>{project.is_deployed ? "Publish settings" : "Publish"}</div>
                      </div>
                    </CustomMenu.MenuItem>
                  )}

                  {project.archive_in > 0 && (
                    <CustomMenu.MenuItem
                      onClick={() => router.push(`/${workspaceSlug}/projects/${project?.id}/archived-issues/`)}
                    >
                      <div className="flex items-center justify-start gap-2">
                        <ArchiveIcon className="h-3.5 w-3.5 stroke-[1.5]" />
                        <span>Archived Issues</span>
                      </div>
                    </CustomMenu.MenuItem>
                  )}
                  <CustomMenu.MenuItem
                    onClick={() => router.push(`/${workspaceSlug}/projects/${project?.id}/draft-issues`)}
                  >
                    <div className="flex items-center justify-start gap-2">
                      <PenSquare className="h-3.5 w-3.5 stroke-[1.5] text-custom-text-300" />
                      <span>Draft Issues</span>
                    </div>
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem
                    onClick={() => router.push(`/${workspaceSlug}/projects/${project?.id}/settings`)}
                  >
                    <div className="flex items-center justify-start gap-2">
                      <Settings className="h-3.5 w-3.5 stroke-[1.5]" />
                      <span>Settings</span>
                    </div>
                  </CustomMenu.MenuItem>

                  {/* leave project */}
                  {isViewerOrGuest && (
                    <CustomMenu.MenuItem onClick={handleLeaveProject}>
                      <div className="flex items-center justify-start gap-2">
                        <LogOut className="h-3.5 w-3.5 stroke-[1.5]" />
                        <span>Leave Project</span>
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
              <Disclosure.Panel className={`space-y-1 mt-1 ${isCollapsed ? "" : "ml-[2.25rem]"}`}>
                {navigation(workspaceSlug as string, project?.id).map((item) => {
                  if (
                    (item.name === "Cycles" && !project.cycle_view) ||
                    (item.name === "Modules" && !project.module_view) ||
                    (item.name === "Views" && !project.issue_views_view) ||
                    (item.name === "Pages" && !project.page_view)
                  )
                    return;

                  return (
                    <Link key={item.name} href={item.href}>
                      <a className="block w-full">
                        <Tooltip
                          tooltipContent={`${project?.name}: ${item.name}`}
                          position="right"
                          className="ml-2"
                          disabled={!isCollapsed}
                        >
                          <div
                            className={`group flex items-center rounded-md px-2 py-1.5 gap-2.5 text-xs font-medium outline-none ${
                              router.asPath.includes(item.href)
                                ? "bg-custom-primary-100/10 text-custom-primary-100"
                                : "text-custom-sidebar-text-300 hover:bg-custom-sidebar-background-80 focus:bg-custom-sidebar-background-80"
                            } ${isCollapsed ? "justify-center" : ""}`}
                          >
                            <item.Icon className="h-4 w-4 stroke-[1.5]" />
                            {!isCollapsed && item.name}
                          </div>
                        </Tooltip>
                      </a>
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
