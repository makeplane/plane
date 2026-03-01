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

import { useCallback, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// Plane
import { EUserPermissionsLevel } from "@plane/constants";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { InitiativeIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { EUserWorkspaceRoles } from "@plane/types";
import { cn } from "@plane/utils";
// components
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useUserPermissions } from "@/hooks/store/user";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web
import { UpdateStatusPills } from "@/components/initiatives/common/update-status";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local components
import { useInitiativeUpdates } from "../details/sidebar/use-updates";
import { InitiativesBlockProperties } from "./initiatives-block-properties";
import { InitiativeQuickActions } from "./quick-actions";

type Props = {
  initiativeId: string;
};

export const InitiativeBlock = observer(function InitiativeBlock(props: Props) {
  const { initiativeId } = props;
  // ref
  const parentRef = useRef<HTMLButtonElement>(null);
  const { workspaceSlug } = useParams();

  const {
    initiative: { getInitiativeById, getInitiativeStatsById, setPeekInitiative },
  } = useInitiatives();

  const { sidebarCollapsed: isSidebarCollapsed } = useAppTheme();
  const { isMobile } = usePlatformOS();
  const { allowPermissions } = useUserPermissions();
  const { handleUpdateOperations } = useInitiativeUpdates(workspaceSlug.toString(), initiativeId);

  const initiative = getInitiativeById(initiativeId);
  const initiativeStats = getInitiativeStatsById(initiativeId);

  if (!initiative) return <></>;

  const isEditable = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const handleInitiativeClick = useCallback(
    (e: React.MouseEvent) => {
      // If command/ctrl + click, open in new tab
      if (e.metaKey || e.ctrlKey) {
        const url = `/${workspaceSlug}/initiatives/${initiativeId}`;
        window.open(url, "_blank");
        return;
      }
      // Otherwise open peek view
      setPeekInitiative({ workspaceSlug: workspaceSlug.toString(), initiativeId });
    },
    [workspaceSlug, initiativeId, setPeekInitiative]
  );

  return (
    <button
      ref={parentRef}
      className={cn(
        "group/initiative-block w-full relative flex flex-col items-center justify-between gap-3 text-13 transition-colors border-b border-subtle bg-layer-transparent hover:bg-layer-transparent-hover",
        {
          "lg:flex-row lg:gap-5 lg:py-0": !isSidebarCollapsed,
          "xl:flex-row xl:gap-5 xl:py-0": isSidebarCollapsed,
        }
      )}
      onClick={handleInitiativeClick}
    >
      <div className="relative flex w-full items-center justify-between gap-1 truncate flex-wrap md:flex-nowrap flex-shrink-0 min-w-0 px-6 py-4 ">
        <div className="flex w-full items-center gap-3 overflow-hidden min-w-0">
          <div className="flex items-center gap-4 truncate">
            <span className="flex items-center flex-shrink-0 bg-layer-3 p-1.5 rounded-sm">
              {initiative?.logo_props?.in_use ? (
                <Logo logo={initiative?.logo_props} size={16} type="lucide" />
              ) : (
                <InitiativeIcon className="h-4 w-4 text-icon-placeholder" />
              )}
            </span>
            <Tooltip tooltipContent={initiative.name} position="top" isMobile={isMobile}>
              <span className="truncate text-13 font-medium text-secondary">{initiative.name}</span>
            </Tooltip>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 h-full">
          <UpdateStatusPills
            handleUpdateOperations={handleUpdateOperations}
            workspaceSlug={workspaceSlug.toString()}
            initiativeId={initiativeId}
            analytics={initiativeStats}
            showTabs
          />
          <InitiativesBlockProperties
            initiative={initiative}
            isSidebarCollapsed={isSidebarCollapsed}
            workspaceSlug={workspaceSlug.toString()}
          />
          <div
            className={cn("hidden", {
              "md:flex": isSidebarCollapsed,
              "lg:flex": !isSidebarCollapsed,
            })}
          >
            <InitiativeQuickActions
              parentRef={parentRef}
              initiative={initiative}
              workspaceSlug={workspaceSlug.toString()}
              disabled={!isEditable}
            />
          </div>
        </div>
      </div>
    </button>
  );
});
