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
// hooks
import { PageHead } from "@/components/core/page-title";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web components
import WorkspaceAccessWrapper from "@/layouts/access/workspace-wrapper";
// types
import type { Route } from "./+types/layout";

function TeamspacesLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  // store
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const currentWorkspace = getWorkspaceBySlug(workspaceSlug);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Teamspaces` : undefined;

  return (
    <WorkspaceAccessWrapper pageKey="team_spaces" workspaceSlug={workspaceSlug}>
      <>
        <PageHead title={pageTitle} />
        <Outlet />
      </>
    </WorkspaceAccessWrapper>
  );
}

export default observer(TeamspacesLayout);
