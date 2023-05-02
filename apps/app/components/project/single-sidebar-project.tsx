import Link from "next/link";
import { useRouter } from "next/router";

// headless ui
import { Disclosure, Transition } from "@headlessui/react";
// ui
import { CustomMenu } from "components/ui";
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
          <div className="flex items-center gap-x-1">
            <Disclosure.Button
              as="div"
              className={`flex w-full cursor-pointer select-none items-center rounded-md py-2 text-left text-sm font-medium ${
                sidebarCollapse ? "justify-center" : "justify-between"
              }`}
            >
              <div className="flex items-center gap-x-2">
                {project.icon ? (
                  <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
                    {String.fromCodePoint(parseInt(project.icon))}
                  </span>
                ) : (
                  <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                    {project?.name.charAt(0)}
                  </span>
                )}

                {!sidebarCollapse && (
                  <p className="overflow-hidden text-ellipsis text-[0.875rem]">
                    {truncateText(project?.name, 20)}
                  </p>
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
                          ? "bg-brand-base text-brand-secondary"
                          : "text-brand-secondary hover:bg-brand-surface-1 hover:text-brand-secondary focus:bg-brand-base focus:text-brand-secondary"
                      } ${sidebarCollapse ? "justify-center" : ""}`}
                    >
                      <div className="grid place-items-center">
                        <item.icon
                          className={`h-5 w-5 flex-shrink-0 text-brand-secondary ${
                            !sidebarCollapse ? "mr-3" : ""
                          }`}
                          color="#858e96"
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
