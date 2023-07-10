import { Fragment } from "react";

import { useRouter } from "next/router";
import Link from "next/link";

// headless ui
import { Menu, Transition } from "@headlessui/react";
// hooks
import useUser from "hooks/use-user";
import useTheme from "hooks/use-theme";
import useWorkspaces from "hooks/use-workspaces";
import useToast from "hooks/use-toast";
// services
import userService from "services/user.service";
import authenticationService from "services/authentication.service";
// components
import { Avatar, Loader } from "components/ui";
// icons
import { CheckIcon, PlusIcon } from "@heroicons/react/24/outline";
// helpers
import { truncateText } from "helpers/string.helper";
// types
import { IWorkspace } from "types";

// Static Data
const userLinks = (workspaceSlug: string) => [
  {
    name: "Workspace Settings",
    href: `/${workspaceSlug}/settings`,
  },
  {
    name: "Workspace Invites",
    href: "/invitations",
  },
  {
    name: "My Profile",
    href: `/${workspaceSlug}/me/profile`,
  },
];

export const WorkspaceSidebarDropdown = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // fetching user details
  const { user, mutateUser } = useUser();
  // fetching theme context
  const { collapsed: sidebarCollapse } = useTheme();

  const { setToastAlert } = useToast();

  // fetching workspaces
  const { activeWorkspace, workspaces } = useWorkspaces();

  const handleWorkspaceNavigation = (workspace: IWorkspace) => {
    userService
      .updateUser({
        last_workspace_id: workspace?.id,
      })
      .then(() => {
        mutateUser();
        router.push(`/${workspace.slug}/`);
      })
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Failed to navigate to the workspace. Please try again.",
        })
      );
  };

  const handleSignOut = async () => {
    await authenticationService
      .signOut()
      .then(() => {
        mutateUser(undefined);
        router.push("/");
      })
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Failed to sign out. Please try again.",
        })
      );
  };

  return (
    <div className="relative">
      <Menu as="div" className="col-span-4 inline-block w-full p-3 text-left">
        <div className="flex items-center justify-between gap-2.5">
          <Menu.Button className="text-custom-sidebar-text-200 flex w-full items-center rounded-md py-2 text-sm font-semibold focus:outline-none">
            <div
              className={`flex w-full items-center gap-x-2 rounded-md bg-custom-sidebar-background-80 px-2 py-1.5 ${
                sidebarCollapse ? "justify-center" : ""
              }`}
            >
              <div className="relative grid h-6 w-6 place-items-center rounded bg-gray-700 uppercase text-white">
                {activeWorkspace?.logo && activeWorkspace.logo !== "" ? (
                  <img
                    src={activeWorkspace.logo}
                    className="absolute top-0 left-0 h-full w-full object-cover rounded"
                    alt="Workspace Logo"
                  />
                ) : (
                  activeWorkspace?.name?.charAt(0) ?? "..."
                )}
              </div>

              {!sidebarCollapse && (
                <p>
                  {activeWorkspace?.name ? truncateText(activeWorkspace.name, 14) : "Loading..."}
                </p>
              )}
            </div>
          </Menu.Button>

          {!sidebarCollapse && (
            <Link href={`/${workspaceSlug}/me/profile`}>
              <a>
                <div className="flex flex-grow justify-end">
                  <Avatar user={user} height="32px" width="32px" fontSize="14px" />
                </div>
              </a>
            </Link>
          )}
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items
            className="fixed left-2 z-20 mt-1 flex w-full max-w-[17rem] origin-top-left flex-col rounded-md
          border border-custom-sidebar-border-100 bg-custom-sidebar-background-90 shadow-lg focus:outline-none"
          >
            <div className="flex flex-col items-start justify-start gap-3 p-3">
              <div className="text-sm text-custom-sidebar-text-200">{user?.email}</div>
              <span className="text-sm font-semibold text-custom-sidebar-text-200">Workspace</span>
              {workspaces ? (
                <div className="flex h-full w-full flex-col items-start justify-start gap-3.5">
                  {workspaces.length > 0 ? (
                    workspaces.map((workspace) => (
                      <Menu.Item key={workspace.id}>
                        {({ active }) => (
                          <button
                            type="button"
                            onClick={() => handleWorkspaceNavigation(workspace)}
                            className="flex w-full items-center justify-between gap-1 rounded-md text-sm text-custom-sidebar-text-100"
                          >
                            <div className="flex items-center justify-start gap-2.5">
                              <span className="relative flex h-6 w-6 items-center justify-center rounded bg-gray-700 p-2 text-xs uppercase text-white">
                                {workspace?.logo && workspace.logo !== "" ? (
                                  <img
                                    src={workspace.logo}
                                    className="absolute top-0 left-0 h-full w-full object-cover rounded"
                                    alt="Workspace Logo"
                                  />
                                ) : (
                                  workspace?.name?.charAt(0) ?? "..."
                                )}
                              </span>

                              <h5 className="text-sm">{truncateText(workspace.name, 18)}</h5>
                            </div>
                            <span className="p-1">
                              <CheckIcon
                                className={`h-3 w-3.5 text-custom-sidebar-text-100 ${
                                  active || workspace.id === activeWorkspace?.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                            </span>
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
                    className="flex w-full items-center gap-1 text-sm text-custom-sidebar-text-200"
                  >
                    <PlusIcon className="h-3 w-3" />
                    Create Workspace
                  </Menu.Item>
                </div>
              ) : (
                <div className="w-full">
                  <Loader className="space-y-2">
                    <Loader.Item height="30px" />
                    <Loader.Item height="30px" />
                  </Loader>
                </div>
              )}
            </div>
            <div className="flex w-full flex-col items-start justify-start gap-2 border-t border-custom-sidebar-border-100 px-3 py-2 text-sm">
              {userLinks(workspaceSlug as string).map((link, index) => (
                <Menu.Item
                  key={index}
                  as="div"
                  className="flex w-full items-center justify-start rounded px-2 py-1 text-sm text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80"
                >
                  <Link href={link.href}>
                    <a className="w-full">{link.name}</a>
                  </Link>
                </Menu.Item>
              ))}
            </div>
            <div className="w-full border-t border-t-custom-sidebar-border-100 px-3 py-2">
              <Menu.Item
                as="button"
                type="button"
                className="flex w-full items-center justify-start rounded px-2 py-1 text-sm text-red-600 hover:bg-custom-sidebar-background-80"
                onClick={handleSignOut}
              >
                Sign out
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
};
