/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "react-router";
import type { TIssueGroupByOptions } from "@plane/types";
// hooks
import { useWorkflowStore } from "@/hooks/store/use-workflow";
// components
import { WorkflowIndicatorIcon } from "@/plane-web/components/issues/workflow/workflow-indicator-icon";

type Props = {
  groupBy?: TIssueGroupByOptions;
  groupId: string | undefined;
};

export const WorkFlowGroupTree = observer(function WorkFlowGroupTree({ groupBy, groupId }: Props) {
  const { projectId } = useParams();
  const workflowStore = useWorkflowStore();

  // Only show indicator when grouping by state and workflow is live
  if (!projectId || !groupId || groupBy !== "state") return <></>;
  if (!workflowStore.isLive(projectId)) return <></>;

  return <WorkflowIndicatorIcon projectId={projectId} stateId={groupId} />;
});
