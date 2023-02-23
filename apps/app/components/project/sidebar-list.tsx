import React, { useState, FC } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Disclosure, Transition } from "@headlessui/react";
import useSWR from "swr";

// icons
import {
  ChevronDownIcon,
  PlusIcon,
  Cog6ToothIcon,
  RectangleStackIcon,
  RectangleGroupIcon,
} from "@heroicons/react/24/outline";
import { CyclesIcon } from "components/icons";
// hooks
import useToast from "hooks/use-toast";
import useTheme from "hooks/use-theme";
// services
import projectService from "services/project.service";
// components
import { CreateProjectModal } from "components/project";
// ui
import { CustomMenu, Loader } from "components/ui";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// fetch-keys
import { PROJECTS_LIST } from "constants/fetch-keys";

const navigation = (workspaceSlug: string, projectId: string) => [
  {
    name: "Issues",
    href: `/${workspaceSlug}/projects/${projectId}/issues`,
    icon: RectangleStackIcon,
  },
  {
    name: "Cycles",
    href: `/${workspaceSlug}/projects/${projectId}/cycles`,
    icon: CyclesIcon,
  },
  {
    name: "Modules",
    href: `/${workspaceSlug}/projects/${projectId}/modules`,
    icon: RectangleGroupIcon,
  },
  {
    name: "Settings",
    href: `/${workspaceSlug}/projects/${projectId}/settings`,
    icon: Cog6ToothIcon,
  },
];

export const ProjectSidebarList: FC = () => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // states
  const [isCreateProjectModal, setCreateProjectModal] = useState(false);
  // theme
  const { collapsed: sidebarCollapse } = useTheme();
  // toast handler
  const { setToastAlert } = useToast();
  // fetching projects list
  const { data: projects } = useSWR(
    workspaceSlug ? PROJECTS_LIST(workspaceSlug as string) : null,
    () => (workspaceSlug ? projectService.getProjects(workspaceSlug as string) : null)
  );

  const handleCopyText = (projectId: string) => {
    const originURL =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    copyTextToClipboard(`${originURL}/${workspaceSlug}/projects/${projectId}/issues`).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Project link copied to clipboard.",
      });
    });
  };

  return (
    <>
      <CreateProjectModal isOpen={isCreateProjectModal} setIsOpen={setCreateProjectModal} />
      <div
        className={`no-scrollbar mt-3 flex h-full flex-col space-y-2 overflow-y-auto bg-primary px-2 pt-5 pb-3 ${
          sidebarCollapse ? "rounded-xl" : "rounded-t-3xl"
        }`}
      >
        {projects ? (
          <>
            {projects.length > 0 ? (
              projects.map((project) => (
                <Disclosure key={project?.id} defaultOpen={projectId === project?.id}>
                  {({ open }) => (
                    <>
                      <div className="flex items-center">
                        <Disclosure.Button
                          className={`flex w-full items-center gap-2 rounded-md p-2 text-left text-sm font-medium ${
                            sidebarCollapse ? "justify-center" : ""
                          }`}
                        >
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
                            <span className="flex w-full items-center justify-between">
                              <span className="w-[125px] text-ellipsis overflow-hidden">
                                {project?.name}
                              </span>
                              <span>
                                <ChevronDownIcon
                                  className={`h-4 w-4 duration-300 ${open ? "rotate-180" : ""}`}
                                />
                              </span>
                            </span>
                          )}
                        </Disclosure.Button>
                        {!sidebarCollapse && (
                          <CustomMenu ellipsis>
                            <CustomMenu.MenuItem onClick={() => handleCopyText(project.id)}>
                              Copy project link
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
                          className={`${
                            sidebarCollapse ? "" : "ml-[2.25rem]"
                          } flex flex-col gap-y-1`}
                        >
                          {navigation(workspaceSlug as string, project?.id).map((item) => {
                            const hi = "hi";

                            if (item.name === "Cycles" && !project.cycle_view) return;
                            if (item.name === "Modules" && !project.module_view) return;

                            return (
                              <Link key={item.name} href={item.href}>
                                <a
                                  className={`group flex items-center rounded-md px-2 py-2 text-xs font-medium outline-none ${
                                    item.href === router.asPath
                                      ? "bg-gray-200 text-gray-900"
                                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900"
                                  } ${sidebarCollapse ? "justify-center" : ""}`}
                                >
                                  <item.icon
                                    className={`h-4 w-4 flex-shrink-0 ${
                                      item.href === router.asPath
                                        ? "text-gray-900"
                                        : "text-gray-500 group-hover:text-gray-900"
                                    } ${!sidebarCollapse ? "mr-3" : ""}`}
                                    aria-hidden="true"
                                  />
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
              ))
            ) : (
              <div className="space-y-3 text-center">
                {!sidebarCollapse && (
                  <h4 className="text-sm text-gray-700">You don{"'"}t have any project yet</h4>
                )}
                <button
                  type="button"
                  className="group flex w-full items-center justify-center gap-2 rounded-md bg-gray-200 p-2 text-xs text-gray-900"
                  onClick={() => setCreateProjectModal(true)}
                >
                  <PlusIcon className="h-4 w-4" />
                  {!sidebarCollapse && "Create Project"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="w-full">
            <Loader className="space-y-5">
              <div className="space-y-2">
                <Loader.Item height="30px" />
                <Loader.Item height="15px" width="80%" light />
                <Loader.Item height="15px" width="80%" light />
                <Loader.Item height="15px" width="80%" light />
              </div>
              <div className="space-y-2">
                <Loader.Item height="30px" />
                <Loader.Item height="15px" width="80%" light />
                <Loader.Item height="15px" width="80%" light />
                <Loader.Item height="15px" width="80%" light />
              </div>
            </Loader>
          </div>
        )}
      </div>
    </>
  );
};
