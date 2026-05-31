/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet } from "react-router";
import { ProjectsAppPowerKProvider } from "@/components/power-k/projects-app-provider";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
import { HelpCenterHeader, HelpSkipLink } from "@/plane-web/components/help-center";

// Standalone, workspace-agnostic Help Center shell. Auth-gated (any logged-in
// user, no workspace membership required) — mirrors the settings/profile pattern
// (no WorkspaceAuthWrapper). Carries its own top bar with a back-to-app link.
export default function HelpCenterLayout() {
  return (
    <>
      <ProjectsAppPowerKProvider />
      <AuthenticationWrapper>
        <div className="relative flex h-full w-full flex-col overflow-hidden bg-canvas">
          {/* Skip-to-content link — visible on focus for keyboard users */}
          <HelpSkipLink />
          <HelpCenterHeader />
          <main id="help-main-content" className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </AuthenticationWrapper>
    </>
  );
}
