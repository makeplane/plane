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
import { PageHead } from "@/components/core/page-title";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { WorkspaceWorklogRoot, WorkspaceWorklogsUpgrade } from "@/components/worklogs";
import { useFlag } from "@/plane-web/hooks/store";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// local imports
import type { Route } from "./+types/page";
import { WorklogsWorkspaceSettingsHeader } from "./header";

function WorklogsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const isFeatureEnabled = useFlag(workspaceSlug, "ISSUE_WORKLOG");
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Worklogs` : undefined;

  if (!currentWorkspace) return <></>;

  return (
    <SettingsContentWrapper header={<WorklogsWorkspaceSettingsHeader />} hugging={isFeatureEnabled}>
      <PageHead title={pageTitle} />
      <WithFeatureFlagHOC workspaceSlug={workspaceSlug} flag="ISSUE_WORKLOG" fallback={<WorkspaceWorklogsUpgrade />}>
        <WorkspaceWorklogRoot workspaceSlug={workspaceSlug} workspaceId={currentWorkspace.id} />
      </WithFeatureFlagHOC>
    </SettingsContentWrapper>
  );
}

export default observer(WorklogsPage);
