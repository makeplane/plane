import { Fragment } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
// headless ui
import { Menu, Transition } from "@headlessui/react";
// next-themes
import { useTheme } from "next-themes";
// hooks
import useUser from "hooks/use-user";
import useWorkspaces from "hooks/use-workspaces";
import useToast from "hooks/use-toast";
// services
import { UserService } from "services/user.service";
import { AuthService } from "services/auth.service";
// components
import { Avatar, Icon } from "components/ui";
import { Loader } from "@plane/ui";
// icons
import { CheckIcon, PlusIcon } from "@heroicons/react/24/outline";
// helpers
import { truncateText } from "helpers/string.helper";
// types
import { IWorkspace } from "types";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";

// Static Data
const userLinks = (workspaceSlug: string, userId: string) => [
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
    href: `/${workspaceSlug}/profile/${userId}`,
  },
];

const profileLinks = (workspaceSlug: string, userId: string) => [
  {
    name: "View profile",
    icon: "account_circle",
    link: `/${workspaceSlug}/profile/${userId}`,
  },
  {
    name: "Settings",
    icon: "settings",
    link: `/${workspaceSlug}/me/profile`,
  },
];

const userService = new UserService();
const authService = new AuthService();

export const WorkspaceSidebarDropdown = () => {
  const store: any = useMobxStore();

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { user, mutateUser } = useUser();

  const { setTheme } = useTheme();

  const { setToastAlert } = useToast();

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
    await authService
      .signOut()
      .then(() => {
        mutateUser(undefined);
        router.push("/");
        setTheme("system");
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
    <div className="inline-flex items-center gap-2 px-4 pt-4">
      <Menu as="div" className="relative col-span-4 inline-block w-full text-left">
        <Menu.Button className="text-custom-sidebar-text-200 flex w-full items-center rounded-sm text-sm font-medium focus:outline-none">
          <div
            className={`flex w-full items-center gap-x-2 rounded-sm bg-custom-sidebar-background-80 p-1 ${
              store?.theme?.sidebarCollapsed ? "justify-center" : ""
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

            {!store?.theme?.sidebarCollapsed && (
              <h4 className="text-custom-text-100">
                {activeWorkspace?.name ? truncateText(activeWorkspace.name, 14) : "Loading..."}
              </h4>
            )}
          </div>
        </Menu.Button>

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
            className="fixed left-4 z-20 mt-1 flex flex-col w-full max-w-[17rem] origin-top-left rounded-md
          border border-custom-sidebar-border-200 bg-custom-sidebar-background-100 shadow-lg outline-none"
          >
            <div className="flex flex-col items-start justify-start gap-3 p-3">
              <span className="text-sm font-medium text-custom-sidebar-text-200">Workspace</span>
              {workspaces ? (
                <div className="flex h-full w-full flex-col items-start justify-start gap-1.5">
                  {workspaces.length > 0 ? (
                    workspaces.map((workspace: IWorkspace) => (
                      <Menu.Item key={workspace.id}>
                        {() => (
                          <button
                            type="button"
                            onClick={() => handleWorkspaceNavigation(workspace)}
                            className="flex w-full items-center justify-between gap-1 p-1 rounded-md text-sm text-custom-sidebar-text-100 hover:bg-custom-sidebar-background-80"
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

                              <h5
                                className={`text-sm ${workspaceSlug === workspace.slug ? "" : "text-custom-text-200"}`}
                              >
                                {truncateText(workspace.name, 18)}
                              </h5>
                            </div>
                            <span className="p-1">
                              <CheckIcon
                                className={`h-3 w-3.5 text-custom-sidebar-text-100 ${
                                  workspace.id === activeWorkspace?.id ? "opacity-100" : "opacity-0"
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
                    className="flex w-full items-center gap-2 px-2 py-1 text-sm text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80"
                  >
                    <PlusIcon className="h-4 w-4" />
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
            <div className="flex w-full flex-col items-start justify-start gap-2 border-t border-custom-sidebar-border-200 px-3 py-2 text-sm">
              {userLinks(workspaceSlug?.toString() ?? "", user?.id ?? "").map((link, index) => (
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

      {!store?.theme?.sidebarCollapsed && (
        <Menu as="div" className="relative flex-shrink-0">
          <Menu.Button className="grid place-items-center outline-none">
            <Avatar user={user} height="28px" width="28px" fontSize="14px" />
          </Menu.Button>

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
              className="absolute left-0 z-20 mt-1.5 flex flex-col w-52  origin-top-left rounded-md
          border border-custom-sidebar-border-200 bg-custom-sidebar-background-100 px-1 py-2 divide-y divide-custom-sidebar-border-200 shadow-lg text-xs outline-none"
            >
              <div className="flex flex-col gap-2.5 pb-2">
                <span className="px-2 text-custom-sidebar-text-200">{user?.email}</span>
                {profileLinks(workspaceSlug?.toString() ?? "", user?.id ?? "").map((link, index) => (
                  <Menu.Item key={index} as="button" type="button">
                    <Link href={link.link}>
                      <a className="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-custom-sidebar-background-80">
                        <Icon iconName={link.icon} className="!text-lg !leading-5" />
                        {link.name}
                      </a>
                    </Link>
                  </Menu.Item>
                ))}
              </div>
              <div className="pt-2">
                <Menu.Item
                  as="button"
                  type="button"
                  className="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-custom-sidebar-background-80"
                  onClick={handleSignOut}
                >
                  <Icon iconName="logout" className="!text-lg !leading-5" />
                  Sign out
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      )}
    </div>
  );
};
