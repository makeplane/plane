/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";

import { PlusIcon, ChevronRightIcon } from "@plane/propel/icons";
import { Transition } from "@headlessui/react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
import { Tooltip } from "@plane/propel/tooltip";
import { EUserWorkspaceRoles } from "@plane/types";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUserPermissions } from "@/hooks/store/user";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";
import { TeamspaceSidebarListItem } from "./list-item";

export const SidebarTeamsList = observer(function SidebarTeamsList() {
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
      <Collapsible
        defaultOpen
        open={isTeamspaceListItemOpen}
        onOpenChange={() => toggleTeamMenu(!isTeamspaceListItemOpen)}
      >
        <div className="group w-full flex items-center justify-between px-1.5  py-2 rounded-sm text-placeholder hover:bg-layer-transparent-hover">
          <CollapsibleTrigger
            type="button"
            className="w-full flex items-center gap-1 whitespace-nowrap text-left text-13 font-semibold text-placeholder"
            onClick={() => toggleTeamMenu(!isTeamspaceListItemOpen)}
            aria-label={t(
              isTeamspaceListItemOpen
                ? "aria_labels.projects_sidebar.close_projects_menu"
                : "aria_labels.projects_sidebar.open_projects_menu"
            )}
          >
            <span className="text-13 font-semibold">{t("teamspaces.label")}</span>
          </CollapsibleTrigger>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <Tooltip tooltipHeading="Create teamspace" tooltipContent="">
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={PlusIcon}
                  onClick={() => {
                    toggleCreateTeamspaceModal({ isOpen: true, teamspaceId: undefined });
                  }}
                  className="hidden group-hover:inline-flex text-placeholder"
                  aria-label={t("aria_labels.projects_sidebar.create_new_project")}
                />
              </Tooltip>
            )}
            <IconButton
              variant="ghost"
              size="sm"
              icon={ChevronRightIcon}
              onClick={() => toggleTeamMenu(!isTeamspaceListItemOpen)}
              className="text-placeholder"
              iconClassName={cn("transition-transform", {
                "rotate-90": isTeamspaceListItemOpen,
              })}
              aria-label={t(
                isTeamspaceListItemOpen
                  ? "aria_labels.projects_sidebar.close_projects_menu"
                  : "aria_labels.projects_sidebar.open_projects_menu"
              )}
            />
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
            <CollapsibleContent className="flex flex-col mt-0.5 gap-0.5">
              {joinedTeamSpaceIds.map((teamspaceId) => (
                <TeamspaceSidebarListItem
                  key={teamspaceId}
                  teamspaceId={teamspaceId}
                  handleLinkClick={handleLinkClick}
                />
              ))}
            </CollapsibleContent>
          )}
        </Transition>
      </Collapsible>
    </>
  );
});
