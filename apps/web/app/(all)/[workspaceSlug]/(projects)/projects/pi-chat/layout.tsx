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
import { EmptyPiChat } from "@/components/pi-chat/empty";
import { PiChatLayout } from "@/components/pi-chat/layout";
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
import type { Route } from "./+types/layout";
import { WithAiFeatureFlagHOC } from "@/components/feature-flags/with-ai-feature-flag-hoc";
import PageNotFound from "@/app/not-found";
import { bootstrapAi } from "@/lib/bootstrap/client-bootstrap";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  await bootstrapAi(params.workspaceSlug);
  return null;
}
clientLoader.hydrate = true as const;
function Layout({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  const { isWorkspaceFeatureEnabled, loader } = useWorkspaceFeatures();
  const shouldUpgrade = !loader && !isWorkspaceFeatureEnabled(workspaceSlug, EWorkspaceFeatures.IS_PI_ENABLED);

  return shouldUpgrade ? (
    <EmptyPiChat workspaceSlug={workspaceSlug} />
  ) : (
    <WithAiFeatureFlagHOC
      workspaceSlug={workspaceSlug}
      flag="AI_CHAT"
      disabledFallback={<EmptyPiChat workspaceSlug={workspaceSlug} />}
      notConfiguredFallback={<PageNotFound />}
    >
      <PiChatLayout isFullScreen isProjectLevel shouldRenderSidebarToggle>
        <Outlet />
      </PiChatLayout>
    </WithAiFeatureFlagHOC>
  );
}

export default observer(Layout);
