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

// components
import { WithFeatureFlagHOC } from "@/components/feature-flags";
// local imports
import { WorkspaceActiveCyclesUpgrade } from "./upgrade";
import { WorkspaceActiveCyclesList } from "./list";

type TWorkspaceActiveCyclesRoot = {
  workspaceSlug: string;
};

export function WorkspaceActiveCyclesRoot(props: TWorkspaceActiveCyclesRoot) {
  const { workspaceSlug } = props;

  return (
    <WithFeatureFlagHOC
      workspaceSlug={workspaceSlug}
      flag="WORKSPACE_ACTIVE_CYCLES"
      fallback={<WorkspaceActiveCyclesUpgrade />}
    >
      <WorkspaceActiveCyclesList workspaceSlug={workspaceSlug} />
    </WithFeatureFlagHOC>
  );
}
