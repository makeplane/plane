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
import { useApplication, useEventTracker, useUser, useWorkspace } from "hooks/store";
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
  } = useApplication();
  const { setTrackElement } = useEventTracker();
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
            <Menu.Button className="group/menu-button h-full w-full truncate rounded-md text-sm font-medium text-sidebar-neutral-text-medium hover:bg-sidebar-neutral-component-surface-dark focus:outline-none">
              <div
                className={`flex items-center  gap-x-2 truncate rounded p-1 ${
                  sidebarCollapsed ? "justify-center" : "justify-between"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div
                    className={`relative grid h-6 w-6 flex-shrink-0 place-items-center uppercase ${
                      !activeWorkspace?.logo && "rounded bg-primary-solid text-white"
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
                    <h4 className="truncate text-base font-medium text-neutral-text-strong">
                      {activeWorkspace?.name ? activeWorkspace.name : "Loading..."}
                    </h4>
                  )}
                </div>
                {!sidebarCollapsed && (
                  <ChevronDown
                    className={`mx-1 hidden h-4 w-4 flex-shrink-0 group-hover/menu-button:block ${
                      open ? "rotate-180" : ""
                    } text-sidebar-neutral-text-subtle duration-300`}
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
                <div className="fixed left-4 z-20 mt-1 flex w-full max-w-[19rem] origin-top-left flex-col rounded-md border-[0.5px] border-sidebar-neutral-border-medium bg-sidebar-neutral-component-surface-light shadow-custom-shadow-rg divide-y divide-neutral-border-subtle outline-none">
                  <div className="flex max-h-96 flex-col items-start justify-start gap-2 overflow-y-scroll mb-2 px-4">
                    <h6 className="sticky top-0 z-10 h-full w-full bg-neutral-component-surface-light pt-3 text-sm font-medium text-sidebar-neutral-text-subtle">
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
                                className="flex items-center justify-between gap-1 rounded p-1 text-sm text-sidebar-neutral-text-strong hover:bg-sidebar-neutral-component-surface-dark"
                              >
                                <div className="flex items-center justify-start gap-2.5 truncate">
                                  <span
                                    className={`relative flex h-6 w-6 flex-shrink-0 items-center  justify-center p-2 text-xs uppercase ${
                                      !workspace?.logo && "rounded bg-primary-solid text-white"
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
                                    className={`truncate text-sm font-medium ${
                                      workspaceSlug === workspace.slug ? "" : "text-neutral-text-medium"
                                    }`}
                                  >
                                    {workspace.name}
                                  </h5>
                                </div>
                                {workspace.id === activeWorkspace?.id && (
                                  <span className="flex-shrink-0 p-1">
                                    <Check className="h-5 w-5 text-sidebar-neutral-text-strong" />
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
                      className="w-full"
                    >
                      <Menu.Item
                        as="div"
                        className="flex items-center gap-2 rounded px-2 py-1 text-sm text-sidebar-neutral-text-medium hover:bg-sidebar-neutral-component-surface-dark font-medium"
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
                          className="flex items-center gap-2 rounded px-2 py-1 text-sm text-sidebar-neutral-text-medium hover:bg-sidebar-neutral-component-surface-dark font-medium"
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
                      className="w-full flex items-center gap-2 rounded px-2 py-1 text-sm text-danger-text-medium hover:bg-sidebar-neutral-component-surface-dark font-medium"
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
              className="absolute left-0 z-20 mt-1 flex w-52 origin-top-left flex-col divide-y
          divide-sidebar-neutral-border-medium rounded-md border border-sidebar-neutral-border-medium bg-sidebar-neutral-component-surface-light px-1 py-2 text-xs shadow-lg outline-none"
              ref={setPopperElement}
              style={styles.popper}
              {...attributes.popper}
            >
              <div className="flex flex-col gap-2.5 pb-2">
                <span className="px-2 text-sidebar-neutral-text-medium">{currentUser?.email}</span>
                {profileLinks(workspaceSlug?.toString() ?? "", currentUser?.id ?? "").map((link, index) => (
                  <Link
                    key={index}
                    href={link.link}
                    onClick={() => {
                      if (index == 0) handleItemClick();
                    }}
                  >
                    <Menu.Item key={index} as="div">
                      <span className="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-sidebar-neutral-component-surface-dark">
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
                  className="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-sidebar-neutral-component-surface-dark"
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
                      <span className="flex w-full items-center justify-center rounded bg-primary-component-surface-light px-2 py-1 text-sm font-medium text-primary-text-subtle hover:bg-primary-component-surface-medium">
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
