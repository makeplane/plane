// react
import React from "react";
// next
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
// services
import userService from "lib/services/user.service";
import authenticationService from "lib/services/authentication.service";
// hooks
import useUser from "lib/hooks/useUser";
// headless ui
import { Menu, Transition } from "@headlessui/react";
// ui
import { Spinner } from "ui";
// icons
import {
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  HomeIcon,
  PlusIcon,
  RectangleStackIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
// types
import { IUser } from "types";

type Props = {
  sidebarCollapse: boolean;
};

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

const WorkspaceOptions: React.FC<Props> = ({ sidebarCollapse }) => {
  const { workspaces, activeWorkspace, user, mutateUser } = useUser();

  const router = useRouter();

  return (
    <div className="px-2">
      <div className="relative">
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
                      className="rounded"
                    />
                  ) : (
                    activeWorkspace?.name?.charAt(0) ?? "N"
                  )}
                </div>
                {!sidebarCollapse && (
                  <p className="text-left ml-1">
                    {activeWorkspace?.name
                      ? activeWorkspace.name.length > 17
                        ? `${activeWorkspace.name.substring(0, 17)}...`
                        : activeWorkspace.name
                      : "Loading..."}
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
              <div className="px-1 py-2 divide-y">
                <div>
                  <Menu.Item as="div" className="text-xs px-2 pb-2">
                    {user?.email}
                  </Menu.Item>
                </div>
                <div className="py-2">
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
                                      const isInProject = router.pathname.includes("/[projectId]/");
                                      if (isInProject) router.push("/workspace");
                                    })
                                    .catch((err) => console.error(err));
                                }}
                                className={`${
                                  active ? "bg-indigo-50" : ""
                                } w-full flex items-center gap-2 text-gray-900 rounded-md p-2 text-sm`}
                              >
                                <div className="h-5 w-5 p-4 flex items-center justify-center bg-gray-700 text-white rounded uppercase relative">
                                  {workspace?.logo && workspace.logo !== "" ? (
                                    <Image
                                      src={workspace.logo}
                                      alt="Workspace Logo"
                                      layout="fill"
                                      objectFit="cover"
                                      className="rounded"
                                    />
                                  ) : (
                                    activeWorkspace?.name?.charAt(0) ?? "N"
                                  )}
                                </div>
                                <div className="text-left">
                                  <h5 className="text-sm">{workspace.name}</h5>
                                  <div className="text-xs text-gray-500">1 members</div>
                                </div>
                              </button>
                            )}
                          </Menu.Item>
                        ))
                      ) : (
                        <p>No workspace found!</p>
                      )}
                      <Menu.Item
                        as="button"
                        type="button"
                        onClick={() => {
                          router.push("/create-workspace");
                        }}
                        className="w-full text-xs flex items-center gap-2 px-2 py-1 text-left rounded hover:bg-gray-100"
                      >
                        <PlusIcon className="h-3 w-3" />
                        Create Workspace
                      </Menu.Item>
                    </>
                  ) : (
                    <div className="w-full flex justify-center">
                      <Spinner />
                    </div>
                  )}
                </div>
                <div className="text-xs pt-2 space-y-1">
                  {userLinks.map((link, index) => (
                    <Menu.Item key={index} as="div">
                      <Link href={link.href}>
                        <a className="block px-2 py-1 text-left rounded hover:bg-gray-100">
                          {link.name}
                        </a>
                      </Link>
                    </Menu.Item>
                  ))}
                  <Menu.Item
                    as="button"
                    type="button"
                    className="w-full px-2 py-1 text-left rounded hover:bg-gray-100"
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
                    Sign out
                  </Menu.Item>
                </div>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
        {/* {!sidebarCollapse && (
          <Menu as="div" className="inline-block text-left flex-shrink-0 w-full">
            <div className="h-10 w-10">
              <Menu.Button className="h-full w-full grid relative place-items-center rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none">
                {user?.avatar && user.avatar !== "" ? (
                  <Image src={user.avatar} alt="User Avatar" layout="fill" className="rounded-md" />
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
        )} */}
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
  );
};

export default WorkspaceOptions;
