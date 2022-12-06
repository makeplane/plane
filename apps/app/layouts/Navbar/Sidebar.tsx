import React, { useState } from "react";
// next
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
// services
import userService from "lib/services/user.service";
import authenticationService from "lib/services/authentication.service";
// hooks
import useUser from "lib/hooks/useUser";
import useTheme from "lib/hooks/useTheme";
// components
import CreateProjectModal from "components/project/CreateProjectModal";
// headless ui
import { Dialog, Disclosure, Menu, Transition } from "@headlessui/react";
// icons
import {
  ArrowPathIcon,
  Bars3Icon,
  ChevronDownIcon,
  Cog6ToothIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  RectangleStackIcon,
  UserGroupIcon,
  UserIcon,
  XMarkIcon,
  ArrowLongLeftIcon,
  QuestionMarkCircleIcon,
  EllipsisHorizontalIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
// constants
import { classNames, copyTextToClipboard } from "constants/common";
// ui
import { CustomListbox, Spinner, Tooltip } from "ui";
// types
import type { IUser } from "types";

const navigation = (projectId: string) => [
  {
    name: "Issues",
    href: `/projects/${projectId}/issues`,
    icon: RectangleStackIcon,
  },
  {
    name: "Cycles",
    href: `/projects/${projectId}/cycles`,
    icon: ArrowPathIcon,
  },
  {
    name: "Members",
    href: `/projects/${projectId}/members`,
    icon: UserGroupIcon,
  },
  {
    name: "Settings",
    href: `/projects/${projectId}/settings`,
    icon: Cog6ToothIcon,
  },
];

const workspaceLinks = [
  {
    icon: HomeIcon,
    name: "Home",
    href: `/workspace`,
  },
  {
    icon: ClipboardDocumentListIcon,
    name: "Projects",
    href: "/projects",
  },
  {
    icon: RectangleStackIcon,
    name: "My Issues",
    href: "/me/my-issues",
  },
  {
    icon: UserGroupIcon,
    name: "Members",
    href: "/workspace/members",
  },
  // {
  //   icon: InboxIcon,
  //   name: "Inbox",
  //   href: "#",
  // },
  {
    icon: Cog6ToothIcon,
    name: "Settings",
    href: "/workspace/settings",
  },
];

const userLinks = [
  {
    name: "My Profile",
    href: "/me/profile",
  },
  {
    name: "Workspace Invites",
    href: "/invitations",
  },
];

const Sidebar: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateProjectModal, setCreateProjectModal] = useState(false);

  const router = useRouter();

  const { projects, user } = useUser();

  const { projectId } = router.query;

  const { workspaces, activeWorkspace, mutateUser } = useUser();

  const { collapsed: sidebarCollapse, toggleCollapsed } = useTheme();

  return (
    <nav className="h-full">
      <CreateProjectModal isOpen={isCreateProjectModal} setIsOpen={setCreateProjectModal} />
      <Transition.Root show={sidebarOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-40 md:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={React.Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as={React.Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
                <Transition.Child
                  as={React.Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="h-0 flex-1 overflow-y-auto pt-5 pb-4">
                  <nav className="mt-5 space-y-1 px-2">
                    {projectId &&
                      navigation(projectId as string).map((item) => (
                        <Link href={item.href} key={item.name}>
                          <a
                            className={classNames(
                              item.href === router.asPath
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                              "group flex items-center px-2 py-2 text-base font-medium rounded-md"
                            )}
                          >
                            <item.icon
                              className={classNames(
                                item.href === router.asPath
                                  ? "text-gray-500"
                                  : "text-gray-400 group-hover:text-gray-500",
                                "mr-4 flex-shrink-0 h-6 w-6"
                              )}
                              aria-hidden="true"
                            />
                            {item.name}
                          </a>
                        </Link>
                      ))}
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
            <div className="w-14 flex-shrink-0" />
          </div>
        </Dialog>
      </Transition.Root>
      <div
        className={`${
          sidebarCollapse ? "" : "w-auto md:w-64"
        } hidden md:inset-y-0 md:flex md:flex-col h-full`}
      >
        <div className="flex flex-1 flex-col border-r border-gray-200">
          <div className="h-full flex flex-1 flex-col pt-5">
            <div className="px-2">
              <div
                className={`relative ${
                  sidebarCollapse ? "flex" : "grid grid-cols-5 gap-2 items-center"
                }`}
              >
                <Menu as="div" className="col-span-4 inline-block text-left w-full">
                  <div className="w-full">
                    <Menu.Button
                      className={`inline-flex justify-between items-center w-full rounded-md px-2 py-2 text-sm font-semibold text-gray-700 focus:outline-none ${
                        !sidebarCollapse
                          ? "hover:bg-gray-50 focus:bg-gray-50 border border-gray-300 shadow-sm"
                          : ""
                      }`}
                    >
                      <div className="flex gap-x-1 items-center">
                        <div className="h-5 w-5 p-4 flex items-center justify-center bg-gray-700 text-white rounded uppercase relative">
                          {activeWorkspace?.logo && activeWorkspace.logo !== "" ? (
                            <Image
                              src={activeWorkspace.logo}
                              alt="Workspace Logo"
                              layout="fill"
                              objectFit="cover"
                            />
                          ) : (
                            activeWorkspace?.name?.charAt(0) ?? "N"
                          )}
                        </div>
                        {!sidebarCollapse && (
                          <p className="truncate w-20 text-left ml-1">
                            {activeWorkspace?.name ?? "Loading..."}
                          </p>
                        )}
                      </div>
                      {!sidebarCollapse && (
                        <div className="flex-grow flex justify-end">
                          <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
                        </div>
                      )}
                    </Menu.Button>
                  </div>

                  <Transition
                    as={React.Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="origin-top-left fixed max-w-[15rem] ml-2 left-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                      <div className="p-1">
                        {workspaces ? (
                          <>
                            {workspaces.length > 0 ? (
                              workspaces.map((workspace: any) => (
                                <Menu.Item key={workspace.id}>
                                  {({ active }) => (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        mutateUser(
                                          (prevData) => ({
                                            ...(prevData as IUser),
                                            last_workspace_id: workspace.id,
                                          }),
                                          false
                                        );
                                        userService
                                          .updateUser({
                                            last_workspace_id: workspace?.id,
                                          })
                                          .then((res) => {
                                            router.push("/workspace");
                                          })
                                          .catch((err) => console.log);
                                      }}
                                      className={`${
                                        active ? "bg-theme text-white" : "text-gray-900"
                                      } group flex w-full items-center rounded-md p-2 text-sm`}
                                    >
                                      {workspace.name}
                                    </button>
                                  )}
                                </Menu.Item>
                              ))
                            ) : (
                              <p>No workspace found!</p>
                            )}
                            <Menu.Item
                              as="button"
                              onClick={() => {
                                router.push("/create-workspace");
                              }}
                              className="w-full"
                            >
                              {({ active }) => (
                                <a
                                  className={`flex items-center gap-x-1 p-2 w-full text-left text-gray-900 hover:bg-theme hover:text-white rounded-md text-sm ${
                                    active ? "bg-theme text-white" : "text-gray-900"
                                  }`}
                                >
                                  <PlusIcon className="w-5 h-5" />
                                  <span>Create Workspace</span>
                                </a>
                              )}
                            </Menu.Item>
                          </>
                        ) : (
                          <div className="w-full flex justify-center">
                            <Spinner />
                          </div>
                        )}
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
                {!sidebarCollapse && (
                  <Menu as="div" className="inline-block text-left flex-shrink-0 w-full">
                    <div className="h-10 w-10">
                      <Menu.Button className="grid relative place-items-center h-full w-full rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none">
                        {user?.avatar && user.avatar !== "" ? (
                          <Image
                            src={user.avatar}
                            alt="User Avatar"
                            layout="fill"
                            className="rounded-md"
                          />
                        ) : (
                          <UserIcon className="h-5 w-5" />
                        )}
                      </Menu.Button>
                    </div>

                    <Transition
                      as={React.Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="origin-top-right absolute left-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                        <div className="p-1">
                          {userLinks.map((item) => (
                            <Menu.Item key={item.name} as="div">
                              {(active) => (
                                <Link href={item.href}>
                                  <a className="flex items-center gap-x-1 p-2 w-full text-left text-gray-900 hover:bg-theme hover:text-white rounded-md text-sm">
                                    {item.name}
                                  </a>
                                </Link>
                              )}
                            </Menu.Item>
                          ))}

                          <Menu.Item as="div">
                            <button
                              type="button"
                              className="flex items-center gap-x-1 p-2 w-full text-left text-gray-900 hover:bg-theme hover:text-white rounded-md text-sm"
                              onClick={async () => {
                                await authenticationService
                                  .signOut({
                                    refresh_token: authenticationService.getRefreshToken(),
                                  })
                                  .then((response) => {
                                    console.log("user signed out", response);
                                  })
                                  .catch((error) => {
                                    console.log("Failed to sign out", error);
                                  })
                                  .finally(() => {
                                    mutateUser();
                                    router.push("/signin");
                                  });
                              }}
                            >
                              Sign Out
                            </button>
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                )}
              </div>
              <div className="mt-3 flex-1 space-y-1 bg-white">
                {workspaceLinks.map((link, index) => (
                  <Link key={index} href={link.href}>
                    <a
                      className={`${
                        link.href === router.asPath
                          ? "bg-theme text-white"
                          : "hover:bg-indigo-100 focus:bg-indigo-100"
                      } flex items-center gap-3 p-2 text-xs font-medium rounded-md outline-none ${
                        sidebarCollapse ? "justify-center" : ""
                      }`}
                    >
                      <link.icon
                        className={`${
                          link.href === router.asPath ? "text-white" : ""
                        } flex-shrink-0 h-4 w-4`}
                        aria-hidden="true"
                      />
                      {!sidebarCollapse && link.name}
                    </a>
                  </Link>
                ))}
              </div>
            </div>
            <div
              className={`flex flex-col px-2 pt-5 pb-3 mt-3 space-y-2 bg-gray-50 h-full overflow-y-auto ${
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
                                className={`w-full flex items-center gap-2 font-medium rounded-md p-2 text-sm ${
                                  sidebarCollapse ? "justify-center" : ""
                                }`}
                              >
                                <span className="bg-gray-700 text-white rounded h-7 w-7 grid place-items-center uppercase flex-shrink-0">
                                  {project?.name.charAt(0)}
                                </span>
                                {!sidebarCollapse && (
                                  <span className="flex items-center justify-between w-full">
                                    {project?.name}
                                    <span>
                                      <ChevronDownIcon
                                        className={`h-4 w-4 duration-300 ${
                                          open ? "rotate-180" : ""
                                        }`}
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
                                                )
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
                        <h4 className="text-gray-700 text-sm">
                          You don{"'"}t have any project yet
                        </h4>
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
            <div
              className={`px-2 py-2 bg-gray-50 w-full self-baseline flex items-center ${
                sidebarCollapse ? "flex-col-reverse" : ""
              }`}
            >
              <button
                type="button"
                className={`flex items-center gap-3 px-2 py-2 text-xs font-medium rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 outline-none ${
                  sidebarCollapse ? "justify-center w-full" : ""
                }`}
                onClick={() => toggleCollapsed()}
              >
                <ArrowLongLeftIcon
                  className={`h-4 w-4 text-gray-500 group-hover:text-gray-900 flex-shrink-0 duration-300 ${
                    sidebarCollapse ? "rotate-180" : ""
                  }`}
                />
              </button>
              <button
                type="button"
                className={`flex items-center gap-3 px-2 py-2 text-xs font-medium rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 outline-none ${
                  sidebarCollapse ? "justify-center w-full" : ""
                }`}
                onClick={() => {
                  const e = new KeyboardEvent("keydown", {
                    ctrlKey: true,
                    key: "h",
                  });
                  document.dispatchEvent(e);
                }}
                title="Help"
              >
                <QuestionMarkCircleIcon className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-10 bg-white pl-1 pt-1 sm:pl-3 sm:pt-3 md:hidden">
        <button
          type="button"
          className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
