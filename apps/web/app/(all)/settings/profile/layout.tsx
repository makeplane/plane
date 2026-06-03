/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet } from "react-router";
// components
import { ProjectsAppPowerKProvider } from "@/components/power-k/projects-app-provider";
// lib
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";

export default function ProfileSettingsLayout() {
  return (
    <>
      <ProjectsAppPowerKProvider />
      <AuthenticationWrapper>
        <div className="relative flex size-full overflow-hidden bg-canvas p-2">
          <main className="relative flex size-full flex-col overflow-hidden rounded-lg border border-subtle bg-surface-1">
            <div className="size-full overflow-hidden">
              <Outlet />
            </div>
          </main>
        </div>
      </AuthenticationWrapper>
    </>
  );
}
