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
import { TeamspaceUpgrade } from "@/components/teamspaces/upgrade";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";

function TeamspacesLayout() {
  // store
  const { currentWorkspace } = useWorkspace();
  // plane web stores
  const { loader, isTeamspacesFeatureEnabled } = useTeamspaces();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Teamspaces` : undefined;
  const shouldUpgrade =
    isTeamspacesFeatureEnabled !== undefined && isTeamspacesFeatureEnabled === false && loader !== "init-loader";

  return (
    <WorkspaceAccessWrapper pageKey="team_spaces">
      {shouldUpgrade ? (
        <div className="h-full w-full max-w-5xl mx-auto flex items-center justify-center">
          <TeamspaceUpgrade />
        </div>
      ) : (
        <>
          <PageHead title={pageTitle} />
          <Outlet />
        </>
      )}
    </WorkspaceAccessWrapper>
  );
}

export default observer(TeamspacesLayout);
