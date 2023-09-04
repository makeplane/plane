import Link from "next/link";
import { useRouter } from "next/router";

import { mutate } from "swr";

// react-beautiful-dnd
import { DraggableProvided, DraggableStateSnapshot } from "react-beautiful-dnd";
// headless ui
import { Disclosure, Transition } from "@headlessui/react";
// services
import projectService from "services/project.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { CustomMenu, Icon, Tooltip } from "components/ui";
// icons
import { EllipsisVerticalIcon, LinkIcon, StarIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  ArchiveOutlined,
  ArticleOutlined,
  ContrastOutlined,
  DatasetOutlined,
  ExpandMoreOutlined,
  FilterNoneOutlined,
  PhotoFilterOutlined,
  SettingsOutlined,
} from "@mui/icons-material";
// helpers
import { renderEmoji } from "helpers/emoji.helper";
// types
import { IProject } from "types";
// fetch-keys
import { PROJECTS_LIST } from "constants/fetch-keys";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

type Props = {
  project: IProject;
  sidebarCollapse: boolean;
  provided?: DraggableProvided;
  snapshot?: DraggableStateSnapshot;
  handleDeleteProject: () => void;
  handleCopyText: () => void;
  handleProjectLeave: () => void;
  shortContextMenu?: boolean;
};

const navigation = (workspaceSlug: string, projectId: string) => [
  {
    name: "Issues",
    href: `/${workspaceSlug}/projects/${projectId}/issues`,
    Icon: FilterNoneOutlined,
  },
  {
    name: "Cycles",
    href: `/${workspaceSlug}/projects/${projectId}/cycles`,
    Icon: ContrastOutlined,
  },
  {
    name: "Modules",
    href: `/${workspaceSlug}/projects/${projectId}/modules`,
    Icon: DatasetOutlined,
  },
  {
    name: "Views",
    href: `/${workspaceSlug}/projects/${projectId}/views`,
    Icon: PhotoFilterOutlined,
  },
  {
    name: "Pages",
    href: `/${workspaceSlug}/projects/${projectId}/pages`,
    Icon: ArticleOutlined,
  },
  {
    name: "Settings",
    href: `/${workspaceSlug}/projects/${projectId}/settings`,
    Icon: SettingsOutlined,
  },
];

export const SingleSidebarProject: React.FC<Props> = observer((props) => {
  const {
    project,
    sidebarCollapse,
    provided,
    snapshot,
    handleDeleteProject,
    handleCopyText,
    handleProjectLeave,
    shortContextMenu = false,
  } = props;

  const store: RootStore = useMobxStore();
  const { projectPublish, project: projectStore } = store;

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const isAdmin = project.member_role === 20;

  const isViewerOrGuest = project.member_role === 10 || project.member_role === 5;

  const handleAddToFavorites = () => {
    if (!workspaceSlug) return;

    mutate<IProject[]>(
      PROJECTS_LIST(workspaceSlug as string, { is_favorite: "all" }),
      (prevData) =>
        (prevData ?? []).map((p) => (p.id === project.id ? { ...p, is_favorite: true } : p)),
      false
    );

    projectService
      .addProjectToFavorites(workspaceSlug as string, {
        project: project.id,
      })
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't remove the project from favorites. Please try again.",
        })
      );
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug) return;

    mutate<IProject[]>(
      PROJECTS_LIST(workspaceSlug as string, { is_favorite: "all" }),
      (prevData) =>
        (prevData ?? []).map((p) => (p.id === project.id ? { ...p, is_favorite: false } : p)),
      false
    );

    projectService.removeProjectFromFavorites(workspaceSlug as string, project.id).catch(() =>
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Couldn't remove the project from favorites. Please try again.",
      })
    );
  };

  return (
    <Disclosure key={project.id} defaultOpen={projectId === project.id}>
      {({ open }) => (
        <>
          <div
            className={`group relative text-custom-sidebar-text-10 px-2 py-1 w-full flex items-center hover:bg-custom-sidebar-background-80 rounded-md ${
              snapshot?.isDragging ? "opacity-60" : ""
            }`}
          >
            {provided && (
              <Tooltip
                tooltipContent={
                  project.sort_order === null
                    ? "Join the project to rearrange"
                    : "Drag to rearrange"
                }
                position="top-right"
              >
                <button
                  type="button"
                  className={`absolute top-1/2 -translate-y-1/2 -left-4 hidden rounded p-0.5 text-custom-sidebar-text-400 ${
                    sidebarCollapse ? "" : "group-hover:!flex"
                  } ${project.sort_order === null ? "opacity-60 cursor-not-allowed" : ""}`}
                  {...provided?.dragHandleProps}
                >
                  <EllipsisVerticalIcon className="h-4" />
                  <EllipsisVerticalIcon className="-ml-5 h-4" />
                </button>
              </Tooltip>
            )}
            <Tooltip
              tooltipContent={`${project.name}`}
              position="right"
              className="ml-2"
              disabled={!sidebarCollapse}
            >
              <Disclosure.Button
                as="div"
                className={`flex items-center flex-grow truncate cursor-pointer select-none text-left text-sm font-medium ${
                  sidebarCollapse ? "justify-center" : `justify-between`
                }`}
              >
                <div
                  className={`flex items-center flex-grow w-full truncate gap-x-2 ${
                    sidebarCollapse ? "justify-center" : ""
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

                  {!sidebarCollapse && (
                    <p className={`truncate ${open ? "" : "text-custom-sidebar-text-200"}`}>
                      {project.name}
                    </p>
                  )}
                </div>
                {!sidebarCollapse && (
                  <ExpandMoreOutlined
                    fontSize="small"
                    className={`flex-shrink-0 ${
                      open ? "rotate-180" : ""
                    } !hidden group-hover:!block text-custom-sidebar-text-400 duration-300`}
                  />
                )}
              </Disclosure.Button>
            </Tooltip>

            {!sidebarCollapse && (
              <CustomMenu
                className="hidden group-hover:block flex-shrink-0"
                buttonClassName="!text-custom-sidebar-text-400 hover:text-custom-sidebar-text-400"
                ellipsis
              >
                {!shortContextMenu && isAdmin && (
                  <CustomMenu.MenuItem onClick={handleDeleteProject}>
                    <span className="flex items-center justify-start gap-2 ">
                      <TrashIcon className="h-4 w-4" />
                      <span>Delete project</span>
                    </span>
                  </CustomMenu.MenuItem>
                )}
                {!project.is_favorite && (
                  <CustomMenu.MenuItem onClick={handleAddToFavorites}>
                    <span className="flex items-center justify-start gap-2">
                      <StarIcon className="h-4 w-4" />
                      <span>Add to favorites</span>
                    </span>
                  </CustomMenu.MenuItem>
                )}
                {project.is_favorite && (
                  <CustomMenu.MenuItem onClick={handleRemoveFromFavorites}>
                    <span className="flex items-center justify-start gap-2">
                      <StarIcon className="h-4 w-4 text-orange-400" fill="#f6ad55" />
                      <span>Remove from favorites</span>
                    </span>
                  </CustomMenu.MenuItem>
                )}
                <CustomMenu.MenuItem onClick={handleCopyText}>
                  <span className="flex items-center justify-start gap-2">
                    <LinkIcon className="h-4 w-4" />
                    <span>Copy project link</span>
                  </span>
                </CustomMenu.MenuItem>

                {/* publish project settings */}
                {isAdmin && (
                  <CustomMenu.MenuItem
                    onClick={() => projectPublish.handleProjectModal(project?.id)}
                  >
                    <div className="flex-shrink-0 relative flex items-center justify-start gap-2">
                      <div className="rounded transition-all w-4 h-4 flex justify-center items-center text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 duration-300 cursor-pointer">
                        <Icon iconName="ios_share" className="!text-base" />
                      </div>
                      <div>{project.is_deployed ? "Publish settings" : "Publish"}</div>
                    </div>
                  </CustomMenu.MenuItem>
                )}

                {project.archive_in > 0 && (
                  <CustomMenu.MenuItem
                    onClick={() =>
                      router.push(`/${workspaceSlug}/projects/${project?.id}/archived-issues/`)
                    }
                  >
                    <div className="flex items-center justify-start gap-2">
                      <ArchiveOutlined fontSize="small" />
                      <span>Archived Issues</span>
                    </div>
                  </CustomMenu.MenuItem>
                )}
                <CustomMenu.MenuItem
                  onClick={() => router.push(`/${workspaceSlug}/projects/${project?.id}/settings`)}
                >
                  <div className="flex items-center justify-start gap-2">
                    <Icon iconName="settings" className="!text-base !leading-4" />
                    <span>Settings</span>
                  </div>
                </CustomMenu.MenuItem>

                {/* leave project */}
                {isViewerOrGuest && (
                  <CustomMenu.MenuItem
                    onClick={() =>
                      projectStore.handleProjectLeaveModal({
                        id: project?.id,
                        name: project?.name,
                        workspaceSlug: workspaceSlug as string,
                      })
                    }
                  >
                    <div className="flex items-center justify-start gap-2">
                      <Icon iconName="logout" className="!text-base !leading-4" />
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
            <Disclosure.Panel className={`space-y-2 mt-1 ${sidebarCollapse ? "" : "ml-[2.25rem]"}`}>
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
                        disabled={!sidebarCollapse}
                      >
                        <div
                          className={`group flex items-center rounded-md px-2 py-1.5 gap-2.5 text-xs font-medium outline-none ${
                            router.asPath.includes(item.href)
                              ? "bg-custom-primary-100/10 text-custom-primary-100"
                              : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 focus:bg-custom-sidebar-background-80"
                          } ${sidebarCollapse ? "justify-center" : ""}`}
                        >
                          <item.Icon
                            sx={{
                              fontSize: 18,
                            }}
                          />
                          {!sidebarCollapse && item.name}
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
  );
});
