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

import { Outlet } from "react-router";
import useSWR from "swr";
// components
import { WikiAppPowerKProvider } from "@/components/command-palette/wiki/provider";
import { WithFeatureFlagHOC } from "@/components/feature-flags/with-feature-flag-hoc";
import { PermissionWrapper } from "@/components/roles-and-permissions/permission-wrapper";
import { WikiAuthScreen } from "@/components/wiki/auth-screen";
import { WikiUpgradeScreen } from "@/components/wiki/upgrade-screen";
// plane web imports
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// local components
import type { Route } from "./+types/layout";
import { PagesAppSidebar } from "./_sidebar";

export default function WikiLayout({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  // store hooks
  const { fetchPagesSummary } = usePageStore(EPageStoreType.WORKSPACE);
  // fetch wiki summary
  useSWR(workspaceSlug ? `WORKSPACE_PAGES_SUMMARY_${workspaceSlug}` : null, workspaceSlug ? fetchPagesSummary : null, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });

  return (
    <>
      <PermissionWrapper
        action="view"
        resource="wiki"
        workspaceSlug={workspaceSlug}
        fallback={<WikiAuthScreen workspaceSlug={workspaceSlug} />}
      >
        <WithFeatureFlagHOC
          flag="WORKSPACE_PAGES"
          workspaceSlug={workspaceSlug}
          fallback={<WikiUpgradeScreen workspaceSlug={workspaceSlug} />}
        >
          <WikiAppPowerKProvider />
          <div className="relative flex h-full w-full overflow-hidden rounded-lg border border-subtle-1">
            <PagesAppSidebar />
            <main className="relative flex h-full w-full flex-col overflow-hidden bg-surface-1">
              <Outlet />
            </main>
          </div>
        </WithFeatureFlagHOC>
      </PermissionWrapper>
    </>
  );
}
