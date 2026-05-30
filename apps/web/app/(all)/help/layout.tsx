/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet } from "react-router";
import { ProjectsAppPowerKProvider } from "@/components/power-k/projects-app-provider";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
import { HelpCenterHeader } from "@/plane-web/components/help-center";

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
          <a
            href="#help-main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface-1 focus:px-3 focus:py-2 focus:text-13 focus:text-primary focus:ring-1 focus:ring-accent-strong"
          >
            Bỏ qua điều hướng
          </a>
          <HelpCenterHeader />
          <main id="help-main-content" className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </AuthenticationWrapper>
    </>
  );
}
