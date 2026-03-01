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
import { useParams } from "next/navigation";
// plane imports
import { ApproverIcon, WorkflowIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssueGroupByOptions } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUser } from "@/hooks/store/user";
// local imports
import { WorkFlowEnabledMessage } from "./workflow-enabled-message";

type Props = {
  groupBy?: TIssueGroupByOptions;
  groupId: string | undefined;
};

export const WorkFlowGroupTree = observer(function WorkFlowGroupTree(props: Props) {
  const { groupBy, groupId } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { data: user } = useUser();
  const { stateTransitionMap, getStateById, getIsWorkflowEnabled } = useProjectState();
  // derived values
  const parentState = getStateById(groupId);
  const isWorkflowEnabled = getIsWorkflowEnabled(workspaceSlug.toString(), parentState?.project_id);
  const stateTransition = groupId ? stateTransitionMap[groupId] : undefined;
  const isTransitionEnabledForState = Object.keys(stateTransition ?? {})?.length > 0;
  const isTransitionEnabledForUser = user?.id
    ? Object.values(stateTransition ?? {}).some((transition) => transition.approvers.includes(user?.id))
    : false;

  if (!isWorkflowEnabled || groupBy !== "state" || !groupId) return <></>;

  if (!isTransitionEnabledForState) return <></>;

  return (
    <Tooltip
      tooltipContent={<WorkFlowEnabledMessage parentStateId={groupId} />}
      className="p-3 border-[0.5px] border-subtle-1 shadow-lg"
      position="bottom-start"
    >
      <div
        className={cn(
          "flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center overflow-hidden rounded-sm transition-all bg-layer-transparent hover:bg-layer-transparent-hover text-icon-primary",
          {
            "bg-[#00A0CC]/15": isTransitionEnabledForUser,
          }
        )}
      >
        {isTransitionEnabledForUser ? (
          <ApproverIcon width={14} strokeWidth={2} className="text-[#00A0CC]" />
        ) : (
          <WorkflowIcon width={14} strokeWidth={2} className="text-secondary" />
        )}
      </div>
    </Tooltip>
  );
});
