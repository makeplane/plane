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
import { Disclosure, Menu, Transition } from "@headlessui/react";
// ui
import { Spinner } from "ui";
// icons
import {
  ChevronDownIcon,
  ClipboardDocumentIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
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
                          <Menu as="div" className="relative inline-block">
                            <Menu.Button className="grid relative place-items-center focus:outline-none">
                              <EllipsisHorizontalIcon className="h-4 w-4" />
                            </Menu.Button>

                            <Transition
                              as={React.Fragment}
                              enter="transition ease-out duration-100"
                              enterFrom="transform opacity-0 scale-95"
                              enterTo="transform opacity-100 scale-100"
                              leave="transition ease-in duration-75"
                              leaveFrom="transform opacity-100 scale-100"
                              leaveTo="transform opacity-0 scale-95"
                            >
                              <Menu.Items className="origin-top-right absolute right-0 mt-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                                <div className="p-1">
                                  <Menu.Item as="div">
                                    {(active) => (
                                      <button
                                        className="flex items-center gap-2 p-2 text-left text-gray-900 hover:bg-theme hover:text-white rounded-md text-xs whitespace-nowrap"
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
                                        <ClipboardDocumentIcon className="h-3 w-3" />
                                        Copy Link
                                      </button>
                                    )}
                                  </Menu.Item>
                                </div>
                              </Menu.Items>
                            </Transition>
                          </Menu>
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
          <div className="w-full flex justify-center">
            <Spinner />
          </div>
        )}
      </div>
    </>
  );
};

export default ProjectsList;
