import { useState } from "react";
import { mutate } from "swr";
import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
import { ChevronLeft, LogOut, MoveLeft, Plus, UserPlus } from "lucide-react";
// hooks
import { useApplication, useUser, useWorkspace } from "hooks/store";
import useToast from "hooks/use-toast";
// ui
import { Tooltip } from "@plane/ui";
// constants
import { PROFILE_ACTION_LINKS } from "constants/profile";

const WORKSPACE_ACTION_LINKS = [
  {
    key: "create-workspace",
    Icon: Plus,
    label: "Create workspace",
    href: "/create-workspace",
  },
  {
    key: "invitations",
    Icon: UserPlus,
    label: "Invitations",
    href: "/invitations",
  },
];

export const ProfileLayoutSidebar = observer(() => {
  // states
  const [isSigningOut, setIsSigningOut] = useState(false);
  // router
  const router = useRouter();
  // next themes
  const { setTheme } = useTheme();
  // toast
  const { setToastAlert } = useToast();
  // store hooks
  const {
    theme: { sidebarCollapsed, toggleSidebar },
  } = useApplication();
  const { currentUser, currentUserSettings, signOut } = useUser();
  const { workspaces } = useWorkspace();

  const workspacesList = Object.values(workspaces ?? {});

  // redirect url for normal mode
  const redirectWorkspaceSlug =
    currentUserSettings?.workspace?.last_workspace_slug ||
    currentUserSettings?.workspace?.fallback_workspace_slug ||
    "";

  const handleSignOut = async () => {
    setIsSigningOut(true);

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
      )
      .finally(() => setIsSigningOut(false));
  };

  return (
    <div
      className={`fixed inset-y-0 z-20 flex h-full flex-shrink-0 flex-grow-0 flex-col border-r border-custom-sidebar-border-200 bg-custom-sidebar-background-100 duration-300 md:relative ${
        sidebarCollapsed ? "" : "md:w-[280px]"
      } ${sidebarCollapsed ? "left-0" : "-left-full md:left-0"}`}
    >
      <div className="flex h-full w-full flex-col gap-y-4">
        <Link href={`/${redirectWorkspaceSlug}`}>
          <div
            className={`flex flex-shrink-0 items-center gap-2 truncate px-4 pt-4 ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <span className="grid h-5 w-5 flex-shrink-0 place-items-center">
              <ChevronLeft className="h-5 w-5" strokeWidth={1} />
            </span>
            {!sidebarCollapsed && (
              <h4 className="truncate text-lg font-semibold text-custom-text-200">Profile settings</h4>
            )}
          </div>
        </Link>
        <div className="flex flex-shrink-0 flex-col overflow-x-hidden px-4">
          {!sidebarCollapsed && (
            <h6 className="rounded px-1.5 text-sm font-semibold text-custom-sidebar-text-400">Your account</h6>
          )}
          <div className="mt-2 h-full space-y-1.5 overflow-y-auto">
            {PROFILE_ACTION_LINKS.map((link) => {
              if (link.key === "change-password" && currentUser?.is_password_autoset) return null;

              return (
                <Link key={link.key} href={link.href} className="block w-full">
                  <Tooltip tooltipContent={link.label} position="right" className="ml-2" disabled={!sidebarCollapsed}>
                    <div
                      className={`group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium outline-none ${
                        link.highlight(router.pathname)
                          ? "bg-custom-primary-100/10 text-custom-primary-100"
                          : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80"
                      } ${sidebarCollapsed ? "justify-center" : ""}`}
                    >
                      {<link.Icon className="h-4 w-4" />}
                      {!sidebarCollapsed && link.label}
                    </div>
                  </Tooltip>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col overflow-x-hidden px-4">
          {!sidebarCollapsed && (
            <h6 className="rounded px-1.5 text-sm font-semibold text-custom-sidebar-text-400">Workspaces</h6>
          )}
          {workspacesList && workspacesList.length > 0 && (
            <div className="mt-2 h-full space-y-1.5 overflow-y-auto">
              {workspacesList.map((workspace) => (
                <Link
                  key={workspace.id}
                  href={`/${workspace.slug}`}
                  className={`flex flex-grow cursor-pointer select-none items-center truncate text-left text-sm font-medium ${
                    sidebarCollapsed ? "justify-center" : `justify-between`
                  }`}
                >
                  <span
                    className={`flex w-full flex-grow items-center gap-x-2 truncate rounded-md px-3 py-1 hover:bg-custom-sidebar-background-80 ${
                      sidebarCollapsed ? "justify-center" : ""
                    }`}
                  >
                    <span
                      className={`relative flex h-6 w-6 flex-shrink-0 items-center  justify-center p-2 text-xs uppercase ${
                        !workspace?.logo && "rounded bg-custom-primary-500 text-white"
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
                    {!sidebarCollapsed && (
                      <p className="truncate text-sm text-custom-sidebar-text-200">{workspace.name}</p>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-1.5">
            {WORKSPACE_ACTION_LINKS.map((link) => (
              <Link className="block w-full" key={link.key} href={link.href}>
                <Tooltip tooltipContent={link.label} position="right" className="ml-2" disabled={!sidebarCollapsed}>
                  <div
                    className={`group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-custom-sidebar-text-200 outline-none hover:bg-custom-sidebar-background-80 focus:bg-custom-sidebar-background-80 ${
                      sidebarCollapsed ? "justify-center" : ""
                    }`}
                  >
                    {<link.Icon className="h-4 w-4" />}
                    {!sidebarCollapsed && link.label}
                  </div>
                </Tooltip>
              </Link>
            ))}
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-grow items-end px-6 py-2">
          <div
            className={`flex w-full ${
              sidebarCollapsed ? "flex-col justify-center gap-2" : "items-center justify-between gap-2"
            }`}
          >
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 text-sm font-medium text-red-500"
              disabled={isSigningOut}
            >
              <LogOut className="h-3.5 w-3.5" />
              {!sidebarCollapsed && <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>}
            </button>
            <button
              type="button"
              className="grid place-items-center rounded-md p-1.5 text-custom-text-200 outline-none hover:bg-custom-background-90 hover:text-custom-text-100 md:hidden"
              onClick={() => toggleSidebar()}
            >
              <MoveLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={`ml-auto hidden place-items-center rounded-md p-1.5 text-custom-text-200 outline-none hover:bg-custom-background-90 hover:text-custom-text-100 md:grid ${
                sidebarCollapsed ? "w-full" : ""
              }`}
              onClick={() => toggleSidebar()}
            >
              <MoveLeft className={`h-3.5 w-3.5 duration-300 ${sidebarCollapsed ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
