/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet } from "react-router";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
import { WorkspaceContentWrapper } from "@/components/workspace/content-wrapper";
import { AppRailVisibilityProvider } from "@/lib/app-rail";
import { GlobalModals } from "@/components/common/modal/global";
import { WorkspaceAuthWrapper } from "@/layouts/auth-layout/workspace-wrapper";
import { useSyncSocket } from "@/hooks/sync/use-sync-socket";
import type { Route } from "./+types/layout";

export default function WorkspaceLayout(props: Route.ComponentProps) {
  const { workspaceSlug } = props.params;

  // Real-time sync: reflects issue/comment/cycle/module/project/pomodoro
  // changes made on other devices (including the native iOS/macOS apps) into
  // this workspace's SWR cache and pomodoro store without a manual refresh.
  useSyncSocket(workspaceSlug);

  return (
    <AuthenticationWrapper>
      <WorkspaceAuthWrapper>
        <AppRailVisibilityProvider>
          <WorkspaceContentWrapper>
            <GlobalModals workspaceSlug={workspaceSlug} />
            <Outlet />
          </WorkspaceContentWrapper>
        </AppRailVisibilityProvider>
      </WorkspaceAuthWrapper>
    </AuthenticationWrapper>
  );
}
