"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// plane imports
import { EUserPermissionsLevel, TEAMSPACE_TRACKER_ELEMENTS } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import { EUserWorkspaceRoles } from "@plane/types";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme"
import { useCommandPalette } from "@/hooks/store/use-command-palette"
import { useUserPermissions } from "@/hooks/store/user";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";
import { TeamspaceSidebarListItem } from "./list-item";

export const SidebarTeamsList = observer(() => {
  // router params
  const { workspaceSlug } = useParams();
  // pathname
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { toggleSidebar } = useAppTheme();
  const { allowPermissions } = useUserPermissions();
  const { toggleCreateTeamspaceModal } = useCommandPalette();
  const { hasPageAccess } = useUserPermissions();
  const { joinedTeamSpaceIds, isTeamspacesFeatureEnabled } = useTeamspaces();
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

  // Return if teamspaces are not enabled or available
  if (!isTeamspacesFeatureEnabled || joinedTeamSpaceIds.length === 0) return null;

  if (!isAuthorized) return null;

  return (
    <>
      <Disclosure as="div" defaultOpen>
        <div className="group flex px-2 mb-0.5 bg-custom-sidebar-background-100 group/workspace-button hover:bg-custom-sidebar-background-90 rounded">
          <Disclosure.Button
            as="button"
            className="flex-1 sticky top-0 w-full flex items-center gap-1 text-custom-sidebar-text-400 text-xs font-semibold outline-none justify-between"
            onClick={() => toggleTeamMenu(!isTeamspaceListItemOpen)}
          >
            <span className="text-sm font-semibold">{t("teamspaces.label")}</span>{" "}
          </Disclosure.Button>
          <div className="flex items-center opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
            {isAdmin && (
              <Tooltip tooltipHeading="Create teamspace" tooltipContent="">
                <button
                  type="button"
                  data-ph-element={TEAMSPACE_TRACKER_ELEMENTS.APP_SIDEBAR_ADD_BUTTON}
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
            <Disclosure.Panel as="div" className="flex flex-col mt-0.5 gap-0.5" static>
              {joinedTeamSpaceIds.map((teamspaceId) => (
                <TeamspaceSidebarListItem
                  key={teamspaceId}
                  teamspaceId={teamspaceId}
                  handleLinkClick={handleLinkClick}
                />
              ))}
            </Disclosure.Panel>
          )}
        </Transition>
      </Disclosure>
    </>
  );
});
