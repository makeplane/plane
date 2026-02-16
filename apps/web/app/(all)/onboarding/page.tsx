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
import useSWR from "swr";

// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { OnboardingRoot } from "@/components/onboarding";
// constants
import { USER_WORKSPACES_LIST } from "@/constants/fetch-keys";
// helpers
import { redirectIfUserIsOnboarded, requireAuthenticatedUser } from "@/lib/middleware/auth-client-middleware";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser } from "@/hooks/store/user";
// services
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

export const clientMiddleware = [requireAuthenticatedUser, redirectIfUserIsOnboarded];

function OnboardingPage() {
  // store hooks
  const { data: user } = useUser();
  const { fetchWorkspaces } = useWorkspace();

  // fetching workspaces list
  useSWR(USER_WORKSPACES_LIST, () => {
    if (user?.id) {
      fetchWorkspaces();
    }
  });

  // fetching user workspace invitations
  const { isLoading: invitationsLoader, data: invitations } = useSWR(
    `USER_WORKSPACE_INVITATIONS_LIST_${user?.id}`,
    () => {
      if (user?.id) return workspaceService.userWorkspaceInvitations();
    }
  );

  return (
    <div className="flex relative size-full overflow-hidden bg-canvas rounded-lg transition-all ease-in-out duration-300">
      <div className="size-full p-2 flex-grow transition-all ease-in-out duration-300 overflow-hidden">
        <div className="relative flex flex-col h-full w-full overflow-hidden rounded-lg bg-surface-1 shadow-md border border-subtle">
          {user && !invitationsLoader ? (
            <OnboardingRoot invitations={invitations ?? []} />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <LogoSpinner />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default observer(OnboardingPage);
