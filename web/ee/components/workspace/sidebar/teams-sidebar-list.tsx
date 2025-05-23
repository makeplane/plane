"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// plane imports
import { EUserWorkspaceRoles, EUserPermissionsLevel } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
// ui
import { Logo, TeamsIcon, Tooltip } from "@plane/ui";
// components
import { SidebarNavItem } from "@/components/sidebar";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme, useCommandPalette, useUserPermissions } from "@/hooks/store";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";

export const SidebarTeamsList = observer(() => {
  // router params
  const { workspaceSlug } = useParams();
  // pathname
  const pathname = usePathname();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { toggleSidebar, sidebarCollapsed } = useAppTheme();
  const { allowPermissions } = useUserPermissions();
  const { toggleCreateTeamspaceModal } = useCommandPalette();
  const { hasPageAccess } = useUserPermissions();
  const { joinedTeamSpaceIds, isTeamspacesFeatureEnabled, getTeamspaceById } = useTeamspaces();
  // local storage
  const { setValue: toggleTeamMenu, storedValue } = useLocalStorage<boolean>("is_teams_list_open", true);
  // derived values
  const isTeamspaceListItemOpen = !!storedValue;
  const isAdmin = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const isAuthorized = hasPageAccess(workspaceSlug?.toString() ?? "", "team_spaces");

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  useEffect(() => {
    if (sidebarCollapsed) toggleTeamMenu(true);
  }, [sidebarCollapsed, toggleTeamMenu]);

  // Return if teamspaces are not enabled or available
  if (!isTeamspacesFeatureEnabled || joinedTeamSpaceIds.length === 0) return null;

  if (!isAuthorized) return null;

  return (
    <>
      <Disclosure as="div" defaultOpen>
        <div
          className={cn(
            "group flex px-2 mb-0.5 bg-custom-sidebar-background-100 group/workspace-button hover:bg-custom-sidebar-background-90 rounded",
            {
              "mt-2.5": !sidebarCollapsed,
            }
          )}
        >
          <Tooltip position="right" tooltipContent={t("teamspaces.label")} disabled={!sidebarCollapsed}>
            <Disclosure.Button
              as="button"
              className={cn(
                "flex-1 sticky top-0 w-full py-1.5 flex items-center gap-1 text-custom-sidebar-text-400 text-xs font-semibold outline-none",
                sidebarCollapsed ? "justify-center" : "justify-between"
              )}
              onClick={() => toggleTeamMenu(!isTeamspaceListItemOpen)}
            >
              {sidebarCollapsed ? (
                <TeamsIcon className="flex-shrink-0 size-3.5" />
              ) : (
                <span className="text-sm font-semibold">{t("teamspaces.label")}</span>
              )}
            </Disclosure.Button>
          </Tooltip>
          {!sidebarCollapsed && (
            <div className="flex items-center opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
              {isAdmin && (
                <Tooltip tooltipHeading="Create teamspace" tooltipContent="">
                  <button
                    type="button"
                    className="p-0.5 rounded hover:bg-custom-sidebar-background-80 text-custom-text-300 flex-shrink-0 outline-none"
                    onClick={() => {
                      toggleCreateTeamspaceModal({ isOpen: true, teamspaceId: undefined });
                    }}
                  >
                    <Plus className="size-3" />
                  </button>
                </Tooltip>
              )}
              <Disclosure.Button
                as="button"
                className="sticky top-0 z-10 group/workspace-button px-0.5 py-1.5 flex items-center justify-between gap-1 text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-90 rounded text-xs font-semibold"
                onClick={() => toggleTeamMenu(!isTeamspaceListItemOpen)}
              >
                <span className="flex-shrink-0 opacity-0 pointer-events-none group-hover/workspace-button:opacity-100 group-hover/workspace-button:pointer-events-auto rounded hover:bg-custom-sidebar-background-80">
                  <ChevronRight
                    className={cn("size-4 flex-shrink-0 text-custom-sidebar-text-400 transition-transform", {
                      "rotate-90": isTeamspaceListItemOpen,
                    })}
                  />
                </span>
              </Disclosure.Button>
            </div>
          )}
        </div>
        <Transition
          show={isTeamspaceListItemOpen}
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          {isTeamspaceListItemOpen && (
            <Disclosure.Panel
              as="div"
              className={cn("flex flex-col mt-0.5 gap-0.5", {
                "space-y-0 mt-0 ml-0": sidebarCollapsed,
              })}
              static
            >
              {joinedTeamSpaceIds.map((teamspaceId) => {
                const teamspace = getTeamspaceById(teamspaceId);
                if (!teamspace) return null;
                return (
                  <Link
                    key={teamspaceId}
                    href={`/${workspaceSlug}/teamspaces/${teamspaceId}`}
                    onClick={handleLinkClick}
                  >
                    <SidebarNavItem
                      className={`${sidebarCollapsed ? "p-0 size-8 aspect-square justify-center mx-auto" : ""}`}
                      isActive={pathname.includes(`/${workspaceSlug}/teamspaces/${teamspaceId}`)}
                    >
                      <div className="flex items-center gap-1.5 py-[1px] truncate">
                        <Logo logo={teamspace.logo_props} size={16} />
                        {!sidebarCollapsed && (
                          <p className="text-sm leading-5 font-medium truncate">{teamspace.name}</p>
                        )}
                      </div>
                    </SidebarNavItem>
                  </Link>
                );
              })}
            </Disclosure.Panel>
          )}
        </Transition>
      </Disclosure>
      <hr
        className={cn("flex-shrink-0 border-custom-sidebar-border-300 h-[0.5px] w-3/5 mx-auto my-1", {
          "opacity-0": !sidebarCollapsed,
        })}
      />
    </>
  );
});
