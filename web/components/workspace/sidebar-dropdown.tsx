import { Fragment } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { Menu, Transition } from "@headlessui/react";
import { Check, ChevronDown, LogOut, Plus, Settings, UserCircle2 } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useToast from "hooks/use-toast";
// services
import { AuthService } from "services/auth.service";
// ui
import { Avatar, Loader } from "@plane/ui";
// types
import { IWorkspace } from "types";

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
    icon: UserCircle2,
    link: `/${workspaceSlug}/profile/${userId}`,
  },
  {
    name: "Settings",
    icon: Settings,
    link: `/${workspaceSlug}/me/profile`,
  },
];

const authService = new AuthService();

export const WorkspaceSidebarDropdown = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store
  const {
    theme: { sidebarCollapsed },
    workspace: { workspaces, currentWorkspace: activeWorkspace },
    user: { currentUser, updateCurrentUser },
  } = useMobxStore();
  // hooks
  const { setToastAlert } = useToast();

  const handleWorkspaceNavigation = (workspace: IWorkspace) => {
    updateCurrentUser({
      last_workspace_id: workspace?.id,
    })
      .then(() => {
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
    <div className="flex items-center gap-x-8 gap-y-2 px-4 pt-4">
      <Menu as="div" className="relative col-span-4 text-left flex-grow h-full truncate">
        {({ open }) => (
          <>
            <Menu.Button className="text-custom-sidebar-text-200 rounded-md hover:bg-custom-sidebar-background-80 text-sm font-medium focus:outline-none w-full h-full truncate">
              <div
                className={`flex items-center gap-x-2 rounded p-1 truncate ${sidebarCollapsed ? "justify-center" : ""}`}
              >
                <div
                  className={`relative grid h-6 w-6 place-items-center uppercase flex-shrink-0 ${
                    !activeWorkspace?.logo && "rounded bg-custom-primary-500 text-white"
                  }`}
                >
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

                {!sidebarCollapsed && (
                  <h4 className="text-custom-text-100 font-medium text-base truncate">
                    {activeWorkspace?.name ? activeWorkspace.name : "Loading..."}
                  </h4>
                )}

                {!sidebarCollapsed && (
                  <ChevronDown
                    className={`h-4 w-4 mx-1 flex-shrink-0 ${
                      open ? "rotate-180" : ""
                    } text-custom-sidebar-text-400 duration-300`}
                  />
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
                                <div className="flex items-center justify-start gap-2.5 truncate">
                                  <span
                                    className={`relative flex h-6 w-6 items-center justify-center  p-2 text-xs uppercase flex-shrink-0 ${
                                      !workspace?.logo && "rounded bg-custom-primary-500 text-white"
                                    }`}
                                  >
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
                                    className={`text-sm truncate ${
                                      workspaceSlug === workspace.slug ? "" : "text-custom-text-200"
                                    }`}
                                  >
                                    {workspace.name}
                                  </h5>
                                </div>
                                {workspace.id === activeWorkspace?.id && (
                                  <span className="p-1 flex-shrink-0">
                                    <Check className="h-3 w-3.5 text-custom-sidebar-text-100" />
                                  </span>
                                )}
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
                        <Plus className="h-4 w-4" />
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
                  {userLinks(workspaceSlug?.toString() ?? "", currentUser?.id ?? "").map((link, index) => (
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
          </>
        )}
      </Menu>

      {!sidebarCollapsed && (
        <Menu as="div" className="relative flex-shrink-0">
          <Menu.Button className="grid place-items-center outline-none">
            <Avatar
              name={currentUser?.display_name}
              src={currentUser?.avatar}
              size={24}
              shape="square"
              className="!text-base"
            />
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
                <span className="px-2 text-custom-sidebar-text-200">{currentUser?.email}</span>
                {profileLinks(workspaceSlug?.toString() ?? "", currentUser?.id ?? "").map((link, index) => (
                  <Menu.Item key={index} as="button" type="button">
                    <Link href={link.link}>
                      <a className="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-custom-sidebar-background-80">
                        <link.icon className="h-4 w-4 stroke-[1.5]" />
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
                  <LogOut className="h-4 w-4 stroke-[1.5]" />
                  Sign out
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      )}
    </div>
  );
});
