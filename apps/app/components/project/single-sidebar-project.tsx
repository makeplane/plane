import Link from "next/link";
import { useRouter } from "next/router";

// headless ui
import { Disclosure, Transition } from "@headlessui/react";
// ui
import { CustomMenu, Icon, Tooltip } from "components/ui";
// icons
import { LinkIcon, StarIcon, TrashIcon } from "@heroicons/react/24/outline";
// helpers
import { truncateText } from "helpers/string.helper";
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
    icon: "stack",
  },
  {
    name: "Cycles",
    href: `/${workspaceSlug}/projects/${projectId}/cycles`,
    icon: "contrast",
  },
  {
    name: "Modules",
    href: `/${workspaceSlug}/projects/${projectId}/modules`,
    icon: "groups",
  },
  {
    name: "Views",
    href: `/${workspaceSlug}/projects/${projectId}/views`,
    icon: "view_list",
  },
  {
    name: "Pages",
    href: `/${workspaceSlug}/projects/${projectId}/pages`,
    icon: "description",
  },
  {
    name: "Settings",
    href: `/${workspaceSlug}/projects/${projectId}/settings`,
    icon: "settings",
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
          <div className="flex items-center gap-x-1">
            <Tooltip
              tooltipContent={`${project?.name}`}
              position="right"
              className="ml-2"
              disabled={!sidebarCollapse}
            >
              <Disclosure.Button
                as="div"
                className={`flex w-full cursor-pointer select-none items-center rounded-sm py-1 text-left text-sm font-medium ${
                  sidebarCollapse ? "justify-center" : "justify-between"
                }`}
              >
                <div className="flex items-center gap-x-2">
                  {project.emoji ? (
                    <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
                      {String.fromCodePoint(parseInt(project.emoji))}
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
                    <p className="overflow-hidden text-ellipsis text-[0.875rem]">
                      {truncateText(project?.name, 14)}
                    </p>
                  )}
                </div>
                {!sidebarCollapse && (
                  <Icon
                    iconName="expand_more"
                    className={`${open ? "rotate-180" : ""} text-brand-secondary duration-300`}
                  />
                )}
              </Disclosure.Button>
            </Tooltip>

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
                    <a className="w-full">
                      <Tooltip
                        tooltipContent={`${project?.name}: ${item.name}`}
                        position="right"
                        className="ml-2"
                        disabled={!sidebarCollapse}
                      >
                        <div
                          className={`group flex items-center rounded-sm px-2 py-1.5 gap-2 text-xs outline-none ${
                            router.asPath.includes(item.href)
                              ? "bg-brand-surface-2 text-brand-base font-medium"
                              : "text-brand-secondary hover:text-brand-base hover:bg-brand-surface-2 focus:bg-brand-surface-2 focus:text-brand-base"
                          } ${sidebarCollapse ? "justify-center" : ""}`}
                        >
                          <Icon
                            iconName={item.icon}
                            className={`${
                              router.asPath.includes(item.href)
                                ? "text-brand-base"
                                : "text-brand-secondary group-hover:text-brand-base"
                            } text-base`}
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
};
