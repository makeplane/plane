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
// icons
import {
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  HomeIcon,
  PlusIcon,
  RectangleStackIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
// types
import { IUser } from "types";
import { Loader } from "ui";

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
        <Menu as="div" className="col-span-4 inline-block w-full text-left">
          <div className="w-full">
            <Menu.Button
              className={`inline-flex w-full items-center justify-between rounded-md px-1 py-2 text-sm font-semibold text-gray-700 focus:outline-none ${
                !sidebarCollapse
                  ? "border border-gray-300 shadow-sm hover:bg-gray-50 focus:bg-gray-50"
                  : ""
              }`}
            >
              <div className="flex items-center gap-x-1">
                <div className="relative flex h-5 w-5 items-center justify-center rounded bg-gray-700 p-4 uppercase text-white">
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
                  <p className="ml-1 text-left">
                    {activeWorkspace?.name
                      ? activeWorkspace.name.length > 17
                        ? `${activeWorkspace.name.substring(0, 17)}...`
                        : activeWorkspace.name
                      : "Loading..."}
                  </p>
                )}
              </div>
              {!sidebarCollapse && (
                <div className="flex flex-grow justify-end">
                  <ChevronDownIcon className="ml-2 h-3 w-3" aria-hidden="true" />
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
            <Menu.Items className="fixed left-2 z-20 mt-1 w-full max-w-[14rem] origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="divide-y px-1 py-2">
                <div>
                  <Menu.Item as="div" className="px-2 pb-2 text-xs">
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
                                  active ? "bg-gray-100" : ""
                                } flex w-full items-center gap-2 rounded-md p-2 text-sm text-gray-900`}
                              >
                                <div className="relative flex h-5 w-5 items-center justify-center rounded bg-gray-700 p-4 uppercase text-white">
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
                        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-gray-100"
                      >
                        <PlusIcon className="h-3 w-3" />
                        Create Workspace
                      </Menu.Item>
                    </>
                  ) : (
                    <div className="w-full">
                      <Loader className="space-y-2">
                        <Loader.Item height="30px"></Loader.Item>
                        <Loader.Item height="30px"></Loader.Item>
                      </Loader>
                    </div>
                  )}
                </div>
                <div className="space-y-1 pt-2 text-xs">
                  {userLinks.map((link, index) => (
                    <Menu.Item key={index} as="div">
                      <Link href={link.href}>
                        <a className="block rounded px-2 py-1 text-left hover:bg-gray-100">
                          {link.name}
                        </a>
                      </Link>
                    </Menu.Item>
                  ))}
                  <Menu.Item
                    as="button"
                    type="button"
                    className="w-full rounded px-2 py-1 text-left hover:bg-gray-100"
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
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-500 hover:bg-gray-100 focus:bg-gray-100"
              } flex items-center gap-3 rounded-md p-2 text-xs font-medium outline-none ${
                sidebarCollapse ? "justify-center" : ""
              }`}
            >
              <link.icon
                className={`${
                  link.href === router.asPath ? "text-gray-900" : "text-gray-500"
                } h-4 w-4 flex-shrink-0`}
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
