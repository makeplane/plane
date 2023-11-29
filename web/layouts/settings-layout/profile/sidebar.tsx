import { mutate } from "swr";
import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
import { Activity, ChevronLeft, CircleUser, KeyRound, LogOut, MoveLeft, Plus, Settings2, UserPlus } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Tooltip } from "@plane/ui";
// hooks
import useToast from "hooks/use-toast";
import { useState } from "react";

const PROFILE_ACTION_LINKS = [
  {
    key: "profile",
    label: "Profile",
    href: `/profile`,
    Icon: CircleUser,
  },
  {
    key: "change-password",
    label: "Change password",
    href: `/profile/change-password`,
    Icon: KeyRound,
  },
  {
    key: "activity",
    label: "Activity",
    href: `/profile/activity`,
    Icon: Activity,
  },
  {
    key: "preferences",
    label: "Preferences",
    href: `/profile/preferences`,
    Icon: Settings2,
  },
];

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

  const {
    theme: { sidebarCollapsed, toggleSidebar },
    workspace: { workspaces },
    user: { currentUser, currentUserSettings, signOut },
  } = useMobxStore();

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
      className={`fixed md:relative inset-y-0 flex flex-col bg-custom-sidebar-background-100 h-full flex-shrink-0 flex-grow-0 border-r border-custom-sidebar-border-200 z-20 duration-300 ${
        sidebarCollapsed ? "" : "md:w-[280px]"
      } ${sidebarCollapsed ? "left-0" : "-left-full md:left-0"}`}
    >
      <div className="h-full w-full flex flex-col gap-y-4">
        <Link href={`/${redirectWorkspaceSlug}`}>
          <a
            className={`flex-shrink-0 flex items-center gap-2 px-4 pt-4 truncate ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <span className="flex-shrink-0 grid place-items-center h-5 w-5">
              <ChevronLeft className="h-5 w-5" strokeWidth={1} />
            </span>
            {!sidebarCollapsed && (
              <h4 className="text-custom-text-200 font-semibold text-lg truncate">Profile settings</h4>
            )}
          </a>
        </Link>
        <div className="flex-shrink-0 flex flex-col overflow-x-hidden px-4">
          {!sidebarCollapsed && (
            <h6 className="rounded text-custom-sidebar-text-400 px-1.5 text-sm font-semibold">Your account</h6>
          )}
          <div className="space-y-1.5 mt-2 h-full overflow-y-auto">
            {PROFILE_ACTION_LINKS.map((link) => {
              if (link.key === "change-password" && currentUser?.is_password_autoset) return null;

              return (
                <Link key={link.key} href={link.href}>
                  <a className="block w-full">
                    <Tooltip tooltipContent={link.label} position="right" className="ml-2" disabled={!sidebarCollapsed}>
                      <div
                        className={`group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium outline-none ${
                          router.pathname === link.href
                            ? "bg-custom-primary-100/10 text-custom-primary-100"
                            : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80"
                        } ${sidebarCollapsed ? "justify-center" : ""}`}
                      >
                        {<link.Icon className="h-4 w-4" />}
                        {!sidebarCollapsed && link.label}
                      </div>
                    </Tooltip>
                  </a>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col overflow-x-hidden px-4">
          {!sidebarCollapsed && (
            <h6 className="rounded text-custom-sidebar-text-400 px-1.5 text-sm font-semibold">Workspaces</h6>
          )}
          {workspaces && workspaces.length > 0 && (
            <div className="space-y-1.5 mt-2 h-full overflow-y-auto">
              {workspaces.map((workspace) => (
                <Link
                  key={workspace.id}
                  href={`/${workspace.slug}`}
                  className={`flex items-center flex-grow truncate cursor-pointer select-none text-left text-sm font-medium ${
                    sidebarCollapsed ? "justify-center" : `justify-between`
                  }`}
                >
                  <span
                    className={`flex items-center flex-grow w-full truncate gap-x-2 px-3 py-1 hover:bg-custom-sidebar-background-80 rounded-md ${
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
                  </span>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-1.5">
            {WORKSPACE_ACTION_LINKS.map((link) => (
              <Link key={link.key} href={link.href}>
                <a className="block w-full">
                  <Tooltip tooltipContent={link.label} position="right" className="ml-2" disabled={!sidebarCollapsed}>
                    <div
                      className={`group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium outline-none text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 focus:bg-custom-sidebar-background-80 ${
                        sidebarCollapsed ? "justify-center" : ""
                      }`}
                    >
                      {<link.Icon className="h-4 w-4" />}
                      {!sidebarCollapsed && link.label}
                    </div>
                  </Tooltip>
                </a>
              </Link>
            ))}
          </div>
        </div>
        <div className="flex-shrink-0 flex-grow flex items-end px-6 py-2">
          <div
            className={`flex w-full ${
              sidebarCollapsed ? "flex-col justify-center gap-2" : "items-center justify-between gap-2"
            }`}
          >
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm text-red-500 flex items-center justify-center gap-2 font-medium"
              disabled={isSigningOut}
            >
              <LogOut className="h-3.5 w-3.5" />
              {!sidebarCollapsed && <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>}
            </button>
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
    </div>
  );
});
