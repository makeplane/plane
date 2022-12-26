// react
import React, { useState } from "react";
// next
import { useRouter } from "next/router";
import Link from "next/link";
// hooks
import useToast from "lib/hooks/useToast";
import useUser from "lib/hooks/useUser";
// components
import CreateProjectModal from "components/project/create-project-modal";
// headless ui
import { Disclosure, Transition } from "@headlessui/react";
// ui
import { CustomMenu, Loader, Spinner } from "ui";
// icons
import { ChevronDownIcon, PlusIcon } from "@heroicons/react/24/outline";
// constants
import { classNames, copyTextToClipboard } from "constants/common";

type Props = {
  navigation: (projectId: string) => Array<{
    name: string;
    href: string;
    icon: (props: any) => JSX.Element;
  }>;
  sidebarCollapse: boolean;
};

const ProjectsList: React.FC<Props> = ({ navigation, sidebarCollapse }) => {
  const [isCreateProjectModal, setCreateProjectModal] = useState(false);

  const { projects } = useUser();
  const { setToastAlert } = useToast();

  const router = useRouter();

  const { projectId } = router.query;

  return (
    <>
      <CreateProjectModal isOpen={isCreateProjectModal} setIsOpen={setCreateProjectModal} />
      <div
        className={`h-full flex flex-col px-2 pt-5 pb-3 mt-3 space-y-2 bg-primary overflow-y-auto ${
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
                          className={`w-full flex items-center text-left gap-2 font-medium rounded-md p-2 text-sm ${
                            sidebarCollapse ? "justify-center" : ""
                          }`}
                        >
                          {project.icon ? (
                            <span className="text-white rounded h-7 w-7 grid place-items-center uppercase flex-shrink-0">
                              {String.fromCodePoint(parseInt(project.icon))}
                            </span>
                          ) : (
                            <span className="bg-gray-700 text-white rounded h-7 w-7 grid place-items-center uppercase flex-shrink-0">
                              {project?.name.charAt(0)}
                            </span>
                          )}

                          {!sidebarCollapse && (
                            <span className="flex items-center justify-between w-full">
                              {project?.name}
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
                            <CustomMenu.MenuItem
                              onClick={() =>
                                copyTextToClipboard(
                                  `https://app.plane.so/projects/${project?.id}/issues/`
                                ).then(() => {
                                  setToastAlert({
                                    title: "Link Copied",
                                    message: "Link copied to clipboard",
                                    type: "success",
                                  });
                                })
                              }
                            >
                              Copy link
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
                          {navigation(project?.id).map((item) => (
                            <Link key={item.name} href={item.href}>
                              <a
                                className={classNames(
                                  item.href === router.asPath
                                    ? "bg-gray-200 text-gray-900"
                                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900",
                                  "group flex items-center px-2 py-2 text-xs font-medium rounded-md outline-none",
                                  sidebarCollapse ? "justify-center" : ""
                                )}
                              >
                                <item.icon
                                  className={classNames(
                                    item.href === router.asPath
                                      ? "text-gray-900"
                                      : "text-gray-500 group-hover:text-gray-900",
                                    "flex-shrink-0 h-4 w-4",
                                    !sidebarCollapse ? "mr-3" : ""
                                  )}
                                  aria-hidden="true"
                                />
                                {!sidebarCollapse && item.name}
                              </a>
                            </Link>
                          ))}
                        </Disclosure.Panel>
                      </Transition>
                    </>
                  )}
                </Disclosure>
              ))
            ) : (
              <div className="text-center space-y-3">
                {!sidebarCollapse && (
                  <h4 className="text-gray-700 text-sm">You don{"'"}t have any project yet</h4>
                )}
                <button
                  type="button"
                  className="group flex justify-center items-center gap-2 w-full rounded-md p-2 text-sm bg-theme text-white"
                  onClick={() => setCreateProjectModal(true)}
                >
                  <PlusIcon className="h-5 w-5" />
                  {!sidebarCollapse && "Create Project"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="w-full">
            <Loader className="space-y-5">
              <div className="space-y-2">
                <Loader.Item height="30px"></Loader.Item>
                <Loader.Item height="15px" width="80%" light></Loader.Item>
                <Loader.Item height="15px" width="80%" light></Loader.Item>
                <Loader.Item height="15px" width="80%" light></Loader.Item>
              </div>
              <div className="space-y-2">
                <Loader.Item height="30px"></Loader.Item>
                <Loader.Item height="15px" width="80%" light></Loader.Item>
                <Loader.Item height="15px" width="80%" light></Loader.Item>
                <Loader.Item height="15px" width="80%" light></Loader.Item>
              </div>
            </Loader>
          </div>
        )}
      </div>
    </>
  );
};

export default ProjectsList;
