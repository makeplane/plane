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
import { Navigate, Outlet } from "react-router";
// components
import { WorkspaceAutomationsWrapper } from "@/components/automations/list/workspace-wrapper";
// plane web imports
import { useFlag } from "@/plane-web/hooks/store/use-flag";
// local imports
import type { Route } from "./+types/layout";

function WorkspaceAutomationsListLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  // derived values
  const isWorkspaceAutomationsFlagAvailable = useFlag(workspaceSlug, "WORKSPACE_AUTOMATIONS");

  if (!isWorkspaceAutomationsFlagAvailable) {
    return <Navigate to={`/${workspaceSlug}/settings/`} />;
  }

  return (
    <WorkspaceAutomationsWrapper workspaceSlug={workspaceSlug}>
      <Outlet />
    </WorkspaceAutomationsWrapper>
  );
}

export default observer(WorkspaceAutomationsListLayout);
