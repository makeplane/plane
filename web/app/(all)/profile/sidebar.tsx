"use client";

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// icons
import {
  ChevronLeft,
  LogOut,
  MoveLeft,
  Activity,
  Bell,
  CircleUser,
  KeyRound,
  Settings2,
  CirclePlus,
  Mails,
} from "lucide-react";
// plane imports
import { PROFILE_ACTION_LINKS } from "@plane/constants";
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
import { cn, getFileURL } from "@plane/utils";
// components
import { SidebarNavItem } from "@/components/sidebar";
// constants
// helpers
// hooks
import { useAppTheme, useUser, useUserSettings, useWorkspace } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

const WORKSPACE_ACTION_LINKS = [
  {
    key: "create_workspace",
    Icon: CirclePlus,
    i18n_label: "create_workspace",
    href: "/create-workspace",
  },
  {
    key: "invitations",
    Icon: Mails,
    i18n_label: "workspace_invites",
    href: "/invitations",
  },
];

const ProjectActionIcons = ({ type, size, className = "" }: { type: string; size?: number; className?: string }) => {
  const icons = {
    profile: CircleUser,
    security: KeyRound,
    activity: Activity,
    preferences: Settings2,
    notifications: Bell,
    "api-tokens": KeyRound,
  };

  if (type === undefined) return null;
  const Icon = icons[type as keyof typeof icons];
  if (!Icon) return null;
  return <Icon size={size} className={className} />;
};
export const ProfileLayoutSidebar = observer(() => {
  // states
  const [isSigningOut, setIsSigningOut] = useState(false);
  // router
  const pathname = usePathname();
  // store hooks
  const { sidebarCollapsed, toggleSidebar } = useAppTheme();
  const { data: currentUser, signOut } = useUser();
  const { data: currentUserSettings } = useUserSettings();
  const { workspaces } = useWorkspace();
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();

  const workspacesList = Object.values(workspaces ?? {});

  // redirect url for normal mode
  const redirectWorkspaceSlug =
    currentUserSettings?.workspace?.last_workspace_slug ||
    currentUserSettings?.workspace?.fallback_workspace_slug ||
    "";

  const ref = useRef<HTMLDivElement>(null);

  useOutsideClickDetector(ref, () => {
    if (sidebarCollapsed === false) {
      if (window.innerWidth < 768) {
        toggleSidebar();
      }
    }
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        toggleSidebar(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [toggleSidebar]);

  const handleItemClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut()
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("sign_out.toast.error.title"),
          message: t("sign_out.toast.error.message"),
        })
      )
      .finally(() => setIsSigningOut(false));
  };

  return (
    <div
      className={`fixed inset-y-0 z-20 flex h-full flex-shrink-0 flex-grow-0 flex-col border-r border-custom-sidebar-border-200 bg-custom-sidebar-background-100 duration-300 md:relative 
        ${sidebarCollapsed ? "-ml-[250px]" : ""}
        sm:${sidebarCollapsed ? "-ml-[250px]" : ""}
        md:ml-0 ${sidebarCollapsed ? "w-[70px]" : "w-[250px]"}
      `}
    >
      <div ref={ref} className="flex h-full w-full flex-col gap-y-4">
        <Link href={`/${redirectWorkspaceSlug}`} onClick={handleItemClick}>
          <div
            className={`flex flex-shrink-0 items-center gap-2 truncate px-4 pt-4 ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <span className="grid h-5 w-5 flex-shrink-0 place-items-center">
              <ChevronLeft className="h-5 w-5" strokeWidth={1} />
            </span>
            {!sidebarCollapsed && (
              <h4 className="truncate text-lg font-semibold text-custom-text-200">{t("profile_settings")}</h4>
            )}
          </div>
        </Link>
        <div className="flex flex-shrink-0 flex-col overflow-x-hidden">
          {!sidebarCollapsed && (
            <h6 className="rounded px-6 text-sm font-semibold text-custom-sidebar-text-400">{t("your_account")}</h6>
          )}
          <div className="vertical-scrollbar scrollbar-sm mt-2 px-4 h-full space-y-1 overflow-y-auto">
            {PROFILE_ACTION_LINKS.map((link) => {
              if (link.key === "change-password" && currentUser?.is_password_autoset) return null;

              return (
                <Link key={link.key} href={link.href} className="block w-full" onClick={handleItemClick}>
                  <Tooltip
                    tooltipContent={t(link.key)}
                    position="right"
                    className="ml-2"
                    disabled={!sidebarCollapsed}
                    isMobile={isMobile}
                  >
                    <SidebarNavItem
                      key={link.key}
                      className={`${sidebarCollapsed ? "p-0 size-8 aspect-square justify-center mx-auto" : ""}`}
                      isActive={link.highlight(pathname)}
                    >
                      <div className="flex items-center gap-1.5 py-[1px]">
                        <ProjectActionIcons type={link.key} size={16} />

                        {!sidebarCollapsed && <p className="text-sm leading-5 font-medium">{t(link.i18n_label)}</p>}
                      </div>
                    </SidebarNavItem>
                  </Tooltip>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col overflow-x-hidden">
          {!sidebarCollapsed && (
            <h6 className="rounded px-6 text-sm font-semibold text-custom-sidebar-text-400">{t("workspaces")}</h6>
          )}
          {workspacesList && workspacesList.length > 0 && (
            <div
              className={cn("vertical-scrollbar scrollbar-xs mt-2 px-4 h-full space-y-1.5 overflow-y-auto", {
                "scrollbar-sm": !sidebarCollapsed,
                "ml-2.5 px-1": sidebarCollapsed,
              })}
            >
              {workspacesList.map((workspace) => (
                <Link
                  key={workspace.id}
                  href={`/${workspace.slug}`}
                  className={`flex flex-grow cursor-pointer select-none items-center truncate text-left text-sm font-medium ${
                    sidebarCollapsed ? "justify-center" : `justify-between`
                  }`}
                  onClick={handleItemClick}
                >
                  <span
                    className={`flex w-full flex-grow items-center gap-x-2 truncate rounded-md px-3 py-1 hover:bg-custom-sidebar-background-80 ${
                      sidebarCollapsed ? "justify-center" : ""
                    }`}
                  >
                    <span
                      className={`relative flex h-6 w-6 flex-shrink-0 items-center  justify-center p-2 text-xs uppercase ${
                        !workspace?.logo_url && "rounded bg-custom-primary-500 text-white"
                      }`}
                    >
                      {workspace?.logo_url && workspace.logo_url !== "" ? (
                        <img
                          src={getFileURL(workspace.logo_url)}
                          className="absolute left-0 top-0 h-full w-full rounded object-cover"
                          alt="Workspace Logo"
                        />
                      ) : (
                        (workspace?.name?.charAt(0) ?? "...")
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
          <div className="mt-1.5 px-4">
            {WORKSPACE_ACTION_LINKS.map((link) => (
              <Link className="block w-full" key={link.key} href={link.href} onClick={handleItemClick}>
                <Tooltip
                  tooltipContent={t(link.key)}
                  position="right"
                  className="ml-2"
                  disabled={!sidebarCollapsed}
                  isMobile={isMobile}
                >
                  <div
                    className={`group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-custom-sidebar-text-200 outline-none hover:bg-custom-sidebar-background-80 focus:bg-custom-sidebar-background-80 ${
                      sidebarCollapsed ? "justify-center" : ""
                    }`}
                  >
                    {<link.Icon className="flex-shrink-0 size-4" />}
                    {!sidebarCollapsed && t(link.i18n_label)}
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
              {!sidebarCollapsed && <span>{isSigningOut ? `${t("signing_out")}...` : t("sign_out")}</span>}
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
