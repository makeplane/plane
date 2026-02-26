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
import { Outlet } from "react-router";
// plane web imports
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { EmptyPiChat } from "@/components/pi-chat/empty";
import { PiChatLayout } from "@/components/pi-chat/layout";
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
import type { Route } from "./+types/layout";

function Layout({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  return isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PI_ENABLED) ? (
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug} flag="AI_CHAT" fallback={<EmptyPiChat />}>
      <PiChatLayout isFullScreen isProjectLevel shouldRenderSidebarToggle>
        <Outlet />
      </PiChatLayout>
    </WithFeatureFlagHOC>
  ) : (
    <EmptyPiChat />
  );
}

export default observer(Layout);
