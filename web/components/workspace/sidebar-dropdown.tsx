import { Fragment, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Menu, Transition } from "@headlessui/react";
import { mutate } from "swr";
import { Check, ChevronDown, CircleUserRound, LogOut, Mails, PlusSquare, Settings, UserCircle2 } from "lucide-react";
import { usePopper } from "react-popper";
// hooks
import { useApplication, useUser, useWorkspace } from "hooks/store";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Avatar, Loader } from "@plane/ui";
// types
import { IWorkspace } from "@plane/types";
// Static Data
const userLinks = (workspaceSlug: string, userId: string) => [
  {
    key: "workspace_invites",
    name: "Workspace invites",
    href: "/invitations",
    icon: Mails,
  },
  {
    key: "view_profile",
    name: "View profile",
    href: `/${workspaceSlug}/profile/${userId}`,
    icon: CircleUserRound,
  },
  {
    key: "settings",
    name: "Settings",
    href: `/${workspaceSlug}/settings`,
    icon: Settings,
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
    link: "/profile",
  },
];
export const WorkspaceSidebarDropdown = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const {
    theme: { sidebarCollapsed, toggleSidebar },
    eventTracker: { setTrackElement },
  } = useApplication();
  const { currentUser, updateCurrentUser, isUserInstanceAdmin, signOut } = useUser();
  const { currentWorkspace: activeWorkspace, workspaces } = useWorkspace();
  // hooks
  const { setToastAlert } = useToast();
  const { setTheme } = useTheme();
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // popper-js init
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "right",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });
  const handleWorkspaceNavigation = (workspace: IWorkspace) =>
    updateCurrentUser({
      last_workspace_id: workspace?.id,
    });
  const handleSignOut = async () => {
    await signOut()
      .then(() => {
        mutate("CURRENT_USER_DETAILS", null);
        setTheme("system");
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
  const handleItemClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };
  const workspacesList = Object.values(workspaces ?? {});
  // TODO: fix workspaces list scroll
  return (
    <div className="flex items-center gap-x-3 gap-y-2 px-4 pt-4">
      <Menu as="div" className="relative h-full flex-grow truncate text-left">
        {({ open }) => (
          <>
            <Menu.Button className="group/menu-button h-full w-full truncate rounded-md text-sm font-medium text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 focus:outline-none">
              <div
                className={`flex items-center  gap-x-2 truncate rounded p-1 ${sidebarCollapsed ? "justify-center" : "justify-between"
                  }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div
                    className={`relative grid h-6 w-6 flex-shrink-0 place-items-center uppercase ${!activeWorkspace?.logo && "rounded bg-custom-primary-500 text-white"
                      }`}
                  >
                    {activeWorkspace?.logo && activeWorkspace.logo !== "" ? (
                      <img
                        src={activeWorkspace.logo}
                        className="absolute left-0 top-0 h-full w-full rounded object-cover"
                        alt="Workspace Logo"
                      />
                    ) : (
                      activeWorkspace?.name?.charAt(0) ?? "..."
                    )}
                  </div>
                  {!sidebarCollapsed && (
                    <h4 className="truncate text-base font-medium text-custom-text-100">
                      {activeWorkspace?.name ? activeWorkspace.name : "Loading..."}
                    </h4>
                  )}
                </div>
                {!sidebarCollapsed && (
                  <ChevronDown
                    className={`mx-1 hidden h-4 w-4 flex-shrink-0 group-hover/menu-button:block ${open ? "rotate-180" : ""
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
              <Menu.Items as={Fragment}>
                <div className="fixed left-4 z-20 mt-1 flex w-full max-w-[19rem] origin-top-left flex-col rounded-md border-[0.5px] border-custom-sidebar-border-300 bg-custom-sidebar-background-100 shadow-custom-shadow-rg divide-y divide-custom-border-100 outline-none">
                  <div className="flex max-h-96 flex-col items-start justify-start gap-2 overflow-y-scroll mb-2 px-4">
                    <h6 className="sticky top-0 z-10 h-full w-full bg-custom-background-100 pt-3 text-sm font-medium text-custom-sidebar-text-400">
                      {currentUser?.email}
                    </h6>
                    {workspacesList ? (
                      <div className="flex h-full w-full flex-col items-start justify-start gap-1.5">
                        {workspacesList.length > 0 &&
                          workspacesList.map((workspace) => (
                            <Link
                              key={workspace.id}
                              href={`/${workspace.slug}`}
                              onClick={() => {
                                handleWorkspaceNavigation(workspace);
                                handleItemClick();
                              }}
                              className="w-full"
                            >
                              <Menu.Item
                                as="div"
                                className="flex items-center justify-between gap-1 rounded p-1 text-sm text-custom-sidebar-text-100 hover:bg-custom-sidebar-background-80"
                              >
                                <div className="flex items-center justify-start gap-2.5 truncate">
                                  <span
                                    className={`relative flex h-6 w-6 flex-shrink-0 items-center  justify-center p-2 text-xs uppercase ${!workspace?.logo && "rounded bg-custom-primary-500 text-white"
                                      }`}
                                  >
                                    {workspace?.logo && workspace.logo !== "" ? (
                                      <img
                                        src={workspace.logo}
                                        className="absolute left-0 top-0 h-full w-full rounded object-cover"
                                        alt="Workspace Logo"
                                      />
                                    ) : (
                                      workspace?.name?.charAt(0) ?? "..."
                                    )}
                                  </span>
                                  <h5
                                    className={`truncate text-sm font-medium ${workspaceSlug === workspace.slug ? "" : "text-custom-text-200"
                                      }`}
                                  >
                                    {workspace.name}
                                  </h5>
                                </div>
                                {workspace.id === activeWorkspace?.id && (
                                  <span className="flex-shrink-0 p-1">
                                    <Check className="h-5 w-5 text-custom-sidebar-text-100" />
                                  </span>
                                )}
                              </Menu.Item>
                            </Link>
                          ))}
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
                  <div className="flex w-full flex-col items-start justify-start gap-2 px-4 py-2 text-sm">
                    <Link
                      href="/create-workspace"
                      onClick={() => setTrackElement("APP_SIDEBAR_WORKSPACE_DROPDOWN")}
                      className="w-full"
                    >
                      <Menu.Item
                        as="div"
                        className="flex items-center gap-2 rounded px-2 py-1 text-sm text-custom-sidebar-text-100 hover:bg-custom-sidebar-background-80 font-medium"
                      >
                        <PlusSquare strokeWidth={1.75} className="h-4 w-4 flex-shrink-0" />
                        Create workspace
                      </Menu.Item>
                    </Link>
                    {userLinks(workspaceSlug?.toString() ?? "", currentUser?.id ?? "").map((link, index) => (
                      <Link
                        key={link.key}
                        href={link.href}
                        className="w-full"
                        onClick={() => {
                          if (index > 0) handleItemClick();
                        }}
                      >
                        <Menu.Item
                          as="div"
                          className="flex items-center gap-2 rounded px-2 py-1 text-sm text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 font-medium"
                        >
                          <link.icon className="h-4 w-4 flex-shrink-0" />
                          {link.name}
                        </Menu.Item>
                      </Link>
                    ))}
                  </div>
                  <div className="w-full px-4 py-2">
                    <Menu.Item
                      as="button"
                      type="button"
                      className="w-full flex items-center gap-2 rounded px-2 py-1 text-sm text-red-600 hover:bg-custom-sidebar-background-80 font-medium"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4 flex-shrink-0" />
                      Sign out
                    </Menu.Item>
                  </div>
                </div>
              </Menu.Items>
            </Transition>
          </>
        )}
      </Menu>
      {!sidebarCollapsed && (
        <Menu as="div" className="relative flex-shrink-0">
          <Menu.Button className="grid place-items-center outline-none" ref={setReferenceElement}>
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
              className="absolute left-0 z-20 mt-1 flex w-52 origin-top-left  flex-col divide-y
          divide-custom-sidebar-border-200 rounded-md border border-custom-sidebar-border-200 bg-custom-sidebar-background-100 px-1 py-2 text-xs shadow-lg outline-none"
              ref={setPopperElement}
              style={styles.popper}
              {...attributes.popper}
            >
              <div className="flex flex-col gap-2.5 pb-2">
                <span className="px-2 text-custom-sidebar-text-200">{currentUser?.email}</span>
                {profileLinks(workspaceSlug?.toString() ?? "", currentUser?.id ?? "").map((link, index) => (
                  <Link
                    key={index}
                    href={link.link}
                    onClick={() => {
                      if (index == 0) handleItemClick();
                    }}
                  >
                    <Menu.Item key={index} as="div">
                      <span className="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-custom-sidebar-background-80">
                        <link.icon className="h-4 w-4 stroke-[1.5]" />
                        {link.name}
                      </span>
                    </Menu.Item>
                  </Link>
                ))}
              </div>
              <div className={`pt-2 ${isUserInstanceAdmin ? "pb-2" : ""}`}>
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
              {isUserInstanceAdmin && (
                <div className="p-2 pb-0">
                  <Link href="/god-mode">
                    <Menu.Item as="button" type="button" className="w-full">
                      <span className="flex w-full items-center justify-center rounded bg-custom-primary-100/20 px-2 py-1 text-sm font-medium text-custom-primary-100 hover:bg-custom-primary-100/30 hover:text-custom-primary-200">
                        Enter God Mode
                      </span>
                    </Menu.Item>
                  </Link>
                </div>
              )}
            </Menu.Items>
          </Transition>
        </Menu>
      )}
    </div>
  );
});