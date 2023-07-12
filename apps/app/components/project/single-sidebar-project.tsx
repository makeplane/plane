import Link from "next/link";
import { useRouter } from "next/router";

// headless ui
import { Disclosure, Transition } from "@headlessui/react";
// ui
import { CustomMenu, Icon } from "components/ui";
// icons
import {
  ChevronDownIcon,
  DocumentTextIcon,
  LinkIcon,
  StarIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  ContrastIcon,
  LayerDiagonalIcon,
  PeopleGroupIcon,
  SettingIcon,
  ViewListIcon,
} from "components/icons";
// helpers
import { truncateText } from "helpers/string.helper";
import { renderEmoji } from "helpers/emoji.helper";
// types
import { IProject } from "types";

type Props = {
  project: IProject;
  sidebarCollapse: boolean;
  handleDeleteProject: () => void;
  handleCopyText: () => void;
  handleAddToFavorites?: () => void;
  handleRemoveFromFavorites?: () => void;
};

const navigation = (workspaceSlug: string, projectId: string) => [
  {
    name: "Issues",
    href: `/${workspaceSlug}/projects/${projectId}/issues`,
    icon: LayerDiagonalIcon,
  },
  {
    name: "Cycles",
    href: `/${workspaceSlug}/projects/${projectId}/cycles`,
    icon: ContrastIcon,
  },
  {
    name: "Modules",
    href: `/${workspaceSlug}/projects/${projectId}/modules`,
    icon: PeopleGroupIcon,
  },
  {
    name: "Views",
    href: `/${workspaceSlug}/projects/${projectId}/views`,
    icon: ViewListIcon,
  },
  {
    name: "Pages",
    href: `/${workspaceSlug}/projects/${projectId}/pages`,
    icon: DocumentTextIcon,
  },
  {
    name: "Settings",
    href: `/${workspaceSlug}/projects/${projectId}/settings`,
    icon: SettingIcon,
  },
];

export const SingleSidebarProject: React.FC<Props> = ({
  project,
  sidebarCollapse,
  handleDeleteProject,
  handleCopyText,
  handleAddToFavorites,
  handleRemoveFromFavorites,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  return (
    <Disclosure key={project?.id} defaultOpen={projectId === project?.id}>
      {({ open }) => (
        <>
          <div className="flex items-center gap-x-1 text-custom-sidebar-text-100">
            <Disclosure.Button
              as="div"
              className={`flex w-full cursor-pointer select-none items-center rounded-md py-2 text-left text-sm font-medium ${
                sidebarCollapse ? "justify-center" : "justify-between"
              }`}
            >
              <div className="flex items-center gap-x-2">
                {project.emoji ? (
                  <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
                    {renderEmoji(project.emoji)}
                  </span>
                ) : project.icon_prop ? (
                  <div className="h-7 w-7 grid place-items-center">
                    <span
                      style={{ color: project.icon_prop.color }}
                      className="material-symbols-rounded text-lg"
                    >
                      {project.icon_prop.name}
                    </span>
                  </div>
                ) : (
                  <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                    {project?.name.charAt(0)}
                  </span>
                )}

                {!sidebarCollapse && (
                  <h5 className={`overflow-hidden text-sm ${open ? "" : "text-custom-text-200"}`}>
                    {truncateText(project?.name, 20)}
                  </h5>
                )}
              </div>
              {!sidebarCollapse && (
                <span>
                  <ChevronDownIcon className={`h-4 w-4 duration-300 ${open ? "rotate-180" : ""}`} />
                </span>
              )}
            </Disclosure.Button>

            {!sidebarCollapse && (
              <CustomMenu ellipsis>
                <CustomMenu.MenuItem onClick={handleDeleteProject}>
                  <span className="flex items-center justify-start gap-2 ">
                    <TrashIcon className="h-4 w-4" />
                    <span>Delete project</span>
                  </span>
                </CustomMenu.MenuItem>
                {handleAddToFavorites && (
                  <CustomMenu.MenuItem onClick={handleAddToFavorites}>
                    <span className="flex items-center justify-start gap-2">
                      <StarIcon className="h-4 w-4" />
                      <span>Add to favorites</span>
                    </span>
                  </CustomMenu.MenuItem>
                )}
                {handleRemoveFromFavorites && (
                  <CustomMenu.MenuItem onClick={handleRemoveFromFavorites}>
                    <span className="flex items-center justify-start gap-2">
                      <StarIcon className="h-4 w-4" />
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
                {project.archive_in > 0 && (
                  <CustomMenu.MenuItem
                    onClick={() =>
                      router.push(`/${workspaceSlug}/projects/${project?.id}/archived-issues/`)
                    }
                  >
                    <div className="flex items-center justify-start gap-2">
                      <Icon iconName="archive" className="h-4 w-4" />
                      <span>Archived Issues</span>
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
            <Disclosure.Panel
              className={`${sidebarCollapse ? "" : "ml-[2.25rem]"} flex flex-col gap-y-1`}
            >
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
                    <a
                      className={`group flex items-center rounded-md p-2 text-xs font-medium outline-none ${
                        router.asPath.includes(item.href)
                          ? "bg-custom-sidebar-background-90 text-custom-sidebar-text-100"
                          : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-90 focus:bg-custom-sidebar-background-90"
                      } ${sidebarCollapse ? "justify-center" : ""}`}
                    >
                      <div className="grid place-items-center">
                        <item.icon
                          className={`h-5 w-5 flex-shrink-0 ${!sidebarCollapse ? "mr-3" : ""}`}
                          color={
                            router.asPath.includes(item.href)
                              ? "rgb(var(--color-sidebar-text-100))"
                              : "rgb(var(--color-sidebar-text-200))"
                          }
                          aria-hidden="true"
                        />
                      </div>
                      {!sidebarCollapse && item.name}
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
};
