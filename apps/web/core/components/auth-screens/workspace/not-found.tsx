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
import { Link } from "react-router";
import { LogOut } from "lucide-react";
// plane imports
import { getButtonStyling } from "@plane/propel/button";
import { PlaneLogo } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { IWorkspace } from "@plane/types";
import { cn } from "@plane/utils";
// assets
import WorkSpaceNotAvailable from "@/app/assets/workspace/workspace-not-available.png?url";
// store hooks
import { useUser } from "@/hooks/store/user/user-user";
import { usePlatformOS } from "@/hooks/use-platform-os";

type WorkspaceNotFoundPageProps = {
  allWorkspaces: IWorkspace[] | undefined;
};

export const WorkspaceNotFoundPage = observer(function WorkspaceNotFoundPage(props: WorkspaceNotFoundPageProps) {
  // props
  const { allWorkspaces } = props;
  // store hooks
  const { signOut, data: currentUser } = useUser();
  const { isMobile } = usePlatformOS();
  // derived values
  const hasWorkspaces = allWorkspaces && allWorkspaces.length > 0;

  const handleSignOut = () => {
    signOut().catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to sign out. Please try again.",
      });
    });
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-surface-2 ">
      <div className="container relative mx-auto flex h-full w-full flex-col overflow-hidden overflow-y-auto px-5 py-14 md:px-0">
        <div className="relative flex flex-shrink-0 items-center justify-between gap-4">
          <div className="z-10 flex-shrink-0 bg-surface-2 py-4">
            <PlaneLogo className="h-9 w-auto text-primary" />
          </div>
          <div className="relative flex items-center gap-2">
            <div className="text-13 font-medium">{currentUser?.email}</div>
            <div
              className="relative flex h-6 w-6 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm hover:bg-layer-1"
              onClick={handleSignOut}
            >
              <Tooltip tooltipContent={"Sign out"} position="top" className="ml-2" isMobile={isMobile}>
                <LogOut size={14} />
              </Tooltip>
            </div>
          </div>
        </div>
        <div className="relative flex h-full w-full flex-grow flex-col items-center justify-center space-y-3">
          <div className="relative flex-shrink-0">
            <img src={WorkSpaceNotAvailable} className="h-[220px] object-contain object-center" alt="Plane logo" />
          </div>
          <h3 className="text-center text-16 font-semibold">Workspace not found</h3>
          <p className="text-center text-13 text-secondary">
            No workspace found with the URL. It may not exist or you lack authorization to view it.
          </p>
          <div className="flex items-center justify-center gap-2 pt-4">
            {hasWorkspaces && (
              <Link to="/" className={cn(getButtonStyling("primary", "base"))}>
                Go Home
              </Link>
            )}
            {hasWorkspaces && (
              <Link
                to={`/${allWorkspaces[0].slug}/settings/account/`}
                className={cn(getButtonStyling("secondary", "base"))}
              >
                Visit Profile
              </Link>
            )}
            {!hasWorkspaces && (
              <Link to={`/create-workspace/`} className={cn(getButtonStyling("secondary", "base"))}>
                Create new workspace
              </Link>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-4 top-0 w-0 bg-layer-1 md:w-0.5" />
      </div>
    </div>
  );
});
