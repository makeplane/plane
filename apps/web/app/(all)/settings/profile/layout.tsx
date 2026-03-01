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

// components
import { Outlet } from "react-router";
// components
import { ProjectsAppPowerKProvider } from "@/components/power-k/projects-app-provider";
import { redirectIfUserIsNotOnboarded, requireAuthenticatedUser } from "@/lib/middleware/auth-client-middleware";

export const clientMiddleware = [requireAuthenticatedUser, redirectIfUserIsNotOnboarded];

export default function ProfileSettingsLayout() {
  return (
    <>
      <ProjectsAppPowerKProvider />
      <div className="relative flex size-full overflow-hidden bg-canvas p-2">
        <main className="relative flex flex-col size-full overflow-hidden bg-surface-1 rounded-lg border border-subtle">
          <div className="size-full overflow-hidden">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
