/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { PageHead } from "@/components/core/page-title";
import { WorkspaceSprintsList } from "@/components/workspace/sprints/sprints-list";
import { useWorkspaceSprint } from "@/hooks/store/use-workspace-sprint";

function WorkspaceSprintDetailPage() {
  const { sprintId } = useParams();
  const { getSprintSquadById } = useWorkspaceSprint();
  const squadId = sprintId?.toString();
  const squad = getSprintSquadById(squadId);

  if (!squadId) return null;

  return (
    <>
      <PageHead title={squad?.name ?? "Squads"} />
      <WorkspaceSprintsList automationId={squadId} />
    </>
  );
}

export default observer(WorkspaceSprintDetailPage);
