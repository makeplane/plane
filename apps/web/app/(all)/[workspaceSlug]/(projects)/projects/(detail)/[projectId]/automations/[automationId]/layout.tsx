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
// components
import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// plane web imports
import { AutomationsDetailsWrapper } from "@/components/automations/details/wrapper";
import { AutomationsListWrapper } from "@/components/automations/list/wrapper";
// local imports
import type { Route } from "./+types/layout";
import { ProjectAutomationDetailsHeader } from "./header";

function AutomationDetailsLayout({ params }: Route.ComponentProps) {
  const { automationId, projectId, workspaceSlug } = params;

  return (
    <AutomationsListWrapper projectId={projectId} workspaceSlug={workspaceSlug}>
      <AutomationsDetailsWrapper automationId={automationId} projectId={projectId} workspaceSlug={workspaceSlug}>
        <AppHeader
          header={
            <ProjectAutomationDetailsHeader
              automationId={automationId}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
            />
          }
        />
        <ContentWrapper className="overflow-hidden">
          <Outlet />
        </ContentWrapper>
      </AutomationsDetailsWrapper>
    </AutomationsListWrapper>
  );
}

export default observer(AutomationDetailsLayout);
