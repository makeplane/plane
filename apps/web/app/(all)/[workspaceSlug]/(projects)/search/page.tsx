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
// plane web components
import { SidebarHamburgerToggle } from "@/components/core/sidebar/sidebar-menu-hamburger-toggle";
import { isSidebarToggleVisible } from "@/components/desktop";
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { AppSearchRoot } from "@/components/workspace/search";
import type { Route } from "./+types/page";

function AppSearchPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;

  return (
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug} flag="ADVANCED_SEARCH" fallback={<></>}>
      {isSidebarToggleVisible() && (
        <div className="block bg-surface-1 p-4 md:hidden">
          <SidebarHamburgerToggle />
        </div>
      )}
      <AppSearchRoot />
    </WithFeatureFlagHOC>
  );
}

export default observer(AppSearchPage);
