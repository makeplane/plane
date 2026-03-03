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
import { useNavigate } from "react-router";
import { useParams, usePathname } from "next/navigation";
import { useMemo } from "react";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { CloseIcon, PiIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { EUserWorkspaceRoles } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { ADMIN_USER_CHECKLIST, MEMBER_USER_CHECKLIST } from "@/components/get-started/widgets/constant";
import { TopNavPowerK } from "@/components/navigation";
import { HelpMenuRoot } from "@/components/workspace/sidebar/help-section/root";
import { UserMenuRoot } from "@/components/workspace/sidebar/user-menu-root";
import { WorkspaceMenuRoot } from "@/components/workspace/sidebar/workspace-menu-root";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
import { useMember } from "@/hooks/store/use-member";
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { useAppRailPreferences } from "@/hooks/use-navigation-preferences";
import { useAppRailVisibility } from "@/lib/app-rail/context";
import { isPiAllowed } from "@/helpers/pi-chat";
import { useFlag, useWorkspaceFeatures, useTheme } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
import { WorkspaceAppSwitcher } from "@/components/workspace/app-switcher";
import { TopNavSearch } from "./top-nav-search";
import { NotificationsPopoverRoot } from "@/components/notifications/popover/root";
import { useWorkspaceNotifications } from "@/hooks/store/notifications";
import useSWR from "swr";
import { Button } from "@plane/propel/button";
import { useAiFlag } from "@/plane-web/hooks/store/use-ai-flag";

export const TopNavigationRoot = observer(function TopNavigationRoot() {
  // store hooks
  const { config } = useInstance();
  const { activeSidecar, openPiChatSidecar, closeSidecar } = useTheme();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const { getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();
  const { workspace: workspaceMemberStore } = useMember();
  // derived values
  const isPiChatSidecarOpen = activeSidecar === "pi-chat";
  const { preferences } = useAppRailPreferences();
  const { isEnabled: isAppRailEnabled, isCollapsed: isAppRailCollapsed } = useAppRailVisibility();
  // router
  const { workspaceSlug, projectId, workItem } = useParams();
  const { getUnreadNotificationsCount } = useWorkspaceNotifications();
  const navigate = useNavigate();

  const pathname = usePathname();

  useSWR(
    workspaceSlug ? "WORKSPACE_UNREAD_NOTIFICATION_COUNT" : null,
    workspaceSlug ? () => getUnreadNotificationsCount(workspaceSlug.toString()) : null
  );

  const shouldRenderPiChat =
    useAiFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.AI_CHAT) &&
    useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.AI_CHAT) &&
    isPiAllowed(pathname, workspaceSlug, projectId, workItem) &&
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PI_ENABLED);

  const isAdvancedSearchEnabled = useFlag(workspaceSlug?.toString(), "ADVANCED_SEARCH");
  const isOpenSearch = config?.is_opensearch_enabled;
  const showLabel = preferences.displayMode === "icon_with_label";

  // Show WorkspaceAppSwitcher when app rail is enabled and collapsed
  const shouldShowAppSwitcher = isAppRailEnabled && isAppRailCollapsed;

  const shouldRenderGetStartedButton = useMemo(() => {
    if (!workspaceSlug) return false;

    const currentWorkspaceRole = getWorkspaceRoleByWorkspaceSlug(workspaceSlug.toString());
    const checklistData = workspaceMemberStore.getGettingStartedChecklistByWorkspaceSlug(workspaceSlug.toString());

    // Select checklist based on role
    const checklist = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN ? ADMIN_USER_CHECKLIST : MEMBER_USER_CHECKLIST;

    // Check if all items in the checklist are completed
    const allCompleted = checklist.every((item) => {
      const key = item.id;
      return checklistData?.[key] === true;
    });

    // Show button if NOT all completed
    return !allCompleted;
  }, [workspaceSlug, getWorkspaceRoleByWorkspaceSlug, workspaceMemberStore]);

  return (
    <div
      className={cn("desktop-header flex items-center min-h-10 w-full px-3.5 z-27 transition-all duration-300", {
        "px-2": !showLabel,
      })}
    >
      <div className="flex flex-1 shrink-0 items-center gap-1.5">
        {shouldShowAppSwitcher && <WorkspaceAppSwitcher />}
        {/* Workspace Menu */}
        <div className="shrink-0">
          <WorkspaceMenuRoot variant="top-navigation" />
        </div>
      </div>
      {/* Power K Search */}
      <div className="desktop-header-actions shrink-0" data-tour="navigation-step-1">
        {isAdvancedSearchEnabled && isOpenSearch ? <TopNavSearch /> : <TopNavPowerK />}
      </div>
      {/* Additional Actions */}
      <div className="desktop-header-actions shrink-0 flex-1 flex items-center gap-1 justify-end">
        {shouldRenderGetStartedButton && (
          <Button
            variant="secondary"
            onClick={() => {
              void navigate(`/${workspaceSlug}/get-started/`);
            }}
          >
            Get Started
          </Button>
        )}
        <NotificationsPopoverRoot workspaceSlug={workspaceSlug?.toString()} />
        <HelpMenuRoot />
        {shouldRenderPiChat && (
          <div data-tour="top-navigation-ai">
            <Tooltip tooltipContent="Ask AI" position="bottom">
              <button
                className={cn(
                  "flex items-center gap-1.5 transition-colors h-8 py-1.5 px-1 rounded-md  bg-layer-1 text-primary hover:bg-layer-1-hover place-items-center w-full",
                  {
                    "bg-layer-1-active": isPiChatSidecarOpen,
                  }
                )}
                onClick={() => (isPiChatSidecarOpen ? closeSidecar() : openPiChatSidecar())}
                data-prevent-outside-click
              >
                <span className="shrink-0 size-5 grid place-items-center text-icon-secondary">
                  {isPiChatSidecarOpen ? <CloseIcon className="size-5" /> : <PiIcon className="size-5" />}
                </span>
                <span className="text-13 leading-normal font-medium pr-1">AI assistant</span>
              </button>
            </Tooltip>
          </div>
        )}
        <UserMenuRoot />
      </div>
    </div>
  );
});
