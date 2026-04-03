/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Outlet } from "react-router";
// plane web imports
import { AutomationsListWrapper } from "@/plane-web/components/automations/list/wrapper";
import type { Route } from "./+types/layout";

function AutomationsListLayout({ params }: Route.ComponentProps) {
  const { projectId, workspaceSlug } = params;

  return (
    <AutomationsListWrapper projectId={projectId} workspaceSlug={workspaceSlug}>
      <Outlet />
    </AutomationsListWrapper>
  );
}

export default observer(AutomationsListLayout);
