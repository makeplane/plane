import { Fragment, useEffect, useRef, useState } from "react";
import { mutate } from "swr";
import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
import { Menu, Transition } from "@headlessui/react";
// icons
import { LogIn, LogOut, MoveLeft, Plus, User, UserPlus } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Avatar, Tooltip } from "@plane/ui";
// hooks
import useToast from "hooks/use-toast";

const SIDEBAR_LINKS = [
  {
    key: "create-workspace",
    Icon: Plus,
    name: "Create workspace",
    href: "/create-workspace",
  },
  {
    key: "invitations",
    Icon: UserPlus,
    name: "Invitations",
    href: "/invitations",
  },
];

export const ProfileLayoutSidebar = observer(() => {
  // states
  const [isScrolled, setIsScrolled] = useState(false); // scroll animation state
  // refs
  const containerRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();

  const { setTheme } = useTheme();

  const { setToastAlert } = useToast();

  const {
    theme: { sidebarCollapsed, toggleSidebar },
    workspace: { workspaces },
    user: { currentUser, currentUserSettings, isUserInstanceAdmin, signOut },
  } = useMobxStore();

  // redirect url for normal mode
  const redirectWorkspaceSlug =
    currentUserSettings?.workspace?.last_workspace_slug ||
    currentUserSettings?.workspace?.fallback_workspace_slug ||
    "";

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

  /**
   * Implementing scroll animation styles based on the scroll length of the container
   */
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        setIsScrolled(scrollTop > 0);
      }
    };
    const currentContainerRef = containerRef.current;
    if (currentContainerRef) {
      currentContainerRef.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (currentContainerRef) {
        currentContainerRef.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  return (
    <div
      className={`fixed md:relative inset-y-0 flex flex-col bg-custom-sidebar-background-100 h-full flex-shrink-0 flex-grow-0 border-r border-custom-sidebar-border-200 z-20 duration-300 ${
        sidebarCollapsed ? "" : "md:w-[280px]"
      } ${sidebarCollapsed ? "left-0" : "-left-full md:left-0"}`}
    >
      <div className="h-full w-full flex flex-col">
        <div className="flex items-center gap-x-3 gap-y-2 px-4 pt-4">
          <div className="w-full h-full truncate">
            <div
              className={`flex flex-grow items-center gap-x-2 rounded p-1 truncate ${
                sidebarCollapsed ? "justify-center" : ""
              }`}
            >
              <div
                className={`flex-shrink-0 flex items-center justify-center h-6 w-6 bg-custom-sidebar-background-80 rounded`}
              >
                <User className="h-5 w-5 text-custom-text-200" />
              </div>

              {!sidebarCollapsed && <h4 className="text-custom-text-200 font-medium text-base truncate">My Profile</h4>}
            </div>
          </div>

          {!sidebarCollapsed && (
            <Tooltip position="bottom-left" tooltipContent="Go back to your workspace">
              <div className="flex-shrink-0">
                <Link href={`/${redirectWorkspaceSlug}`}>
                  <a>
                    <LogIn className="h-5 w-5 text-custom-text-200 rotate-180" />
                  </a>
                </Link>
              </div>
            </Tooltip>
          )}

          {!sidebarCollapsed && (
            <Menu as="div" className="relative flex-shrink-0 ">
              <Menu.Button className="flex gap-4 place-items-center outline-none">
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
                <Menu.Items className="absolute left-0 z-20 mt-1 w-52 rounded-md border border-custom-sidebar-border-200 bg-custom-sidebar-background-100 px-1 py-2 shadow-custom-shadow-rg text-xs space-y-2 outline-none">
                  <span className="px-2 text-custom-sidebar-text-200">{currentUser?.email}</span>
                  <Menu.Item
                    as="button"
                    type="button"
                    className="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-custom-sidebar-background-80"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 stroke-[1.5]" />
                    Sign out
                  </Menu.Item>
                  {isUserInstanceAdmin && (
                    <div className="p-2 pb-0 border-t border-custom-border-100">
                      <Menu.Item as="button" type="button" className="w-full">
                        <Link href="/god-mode">
                          <a className="flex w-full items-center justify-center rounded px-2 py-1 text-sm font-medium text-custom-primary-100 hover:text-custom-primary-200 bg-custom-primary-100/20 hover:bg-custom-primary-100/30">
                            Enter God Mode
                          </a>
                        </Link>
                      </Menu.Item>
                    </div>
                  )}
                </Menu.Items>
              </Transition>
            </Menu>
          )}
        </div>

        <div className="w-full cursor-pointer space-y-1 p-4 flex-shrink-0">
          {SIDEBAR_LINKS.map((link) => (
            <Link key={link.key} href={link.href}>
              <a className="block w-full">
                <Tooltip tooltipContent={link.name} position="right" className="ml-2" disabled={!sidebarCollapsed}>
                  <div
                    className={`group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium outline-none text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 focus:bg-custom-sidebar-background-80 ${
                      sidebarCollapsed ? "justify-center" : ""
                    }`}
                  >
                    {<link.Icon className="h-4 w-4" />}
                    {!sidebarCollapsed && link.name}
                  </div>
                </Tooltip>
              </a>
            </Link>
          ))}
        </div>
        {workspaces && workspaces.length > 0 && (
          <div className="flex flex-col h-full overflow-x-hidden px-4">
            {!sidebarCollapsed && (
              <div className="rounded text-custom-sidebar-text-400 px-1.5 text-sm font-semibold">Your workspaces</div>
            )}
            <div
              ref={containerRef}
              className={`space-y-2 mt-2 pt-2 h-full overflow-y-auto ${
                isScrolled ? "border-t border-custom-sidebar-border-300" : ""
              }`}
            >
              {workspaces.map((workspace) => (
                <Link
                  key={workspace.id}
                  href={`/${workspace.slug}`}
                  className={`flex items-center flex-grow truncate cursor-pointer select-none text-left text-sm font-medium ${
                    sidebarCollapsed ? "justify-center" : `justify-between`
                  }`}
                >
                  <a
                    className={`flex items-center flex-grow w-full truncate gap-x-2 px-2 py-1 hover:bg-custom-sidebar-background-80 rounded-md ${
                      sidebarCollapsed ? "justify-center" : ""
                    }`}
                  >
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
                    {!sidebarCollapsed && (
                      <p className="truncate text-custom-sidebar-text-200 text-sm">{workspace.name}</p>
                    )}
                  </a>
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="flex-grow flex items-end px-4 py-2 border-t border-custom-border-200">
          <button
            type="button"
            className="grid place-items-center rounded-md p-1.5 text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-90 outline-none md:hidden"
            onClick={() => toggleSidebar()}
          >
            <MoveLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className={`hidden md:grid place-items-center rounded-md p-1.5 text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-90 outline-none ml-auto ${
              sidebarCollapsed ? "w-full" : ""
            }`}
            onClick={() => toggleSidebar()}
          >
            <MoveLeft className={`h-3.5 w-3.5 duration-300 ${sidebarCollapsed ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
});
