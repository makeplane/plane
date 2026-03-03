/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import useSWR from "swr";

// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { OnboardingRoot } from "@/components/onboarding";
// constants
import { USER_WORKSPACES_LIST } from "@/constants/fetch-keys";
// helpers
import { EPageTypes } from "@/helpers/authentication.helper";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser } from "@/hooks/store/user";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
// services
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

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
    <AuthenticationWrapper pageType={EPageTypes.ONBOARDING}>
      <div className="relative flex size-full overflow-hidden rounded-lg bg-canvas transition-all duration-300 ease-in-out">
        <div className="size-full flex-grow overflow-hidden p-2 transition-all duration-300 ease-in-out">
          <div className="shadow-md relative flex h-full w-full flex-col overflow-hidden rounded-lg border border-subtle bg-surface-1">
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
    </AuthenticationWrapper>
  );
}

export default observer(OnboardingPage);
