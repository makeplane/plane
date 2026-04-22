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
import { Popover } from "@plane/propel/popover";
import { cn } from "@plane/utils";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUser } from "@/hooks/store/user";
import { useWorkflows } from "@/hooks/store/use-workflows";
// local imports
import { WorkFlowEnabledMessage } from "./workflow-enabled-message";

type Props = {
  groupId: string | undefined;
  typeId?: string | null;
};

export const WorkFlowGroupTree = observer(function WorkFlowGroupTree(props: Props) {
  const { groupId, typeId } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { data: user } = useUser();
  const { getStateById } = useProjectState();
  const { isWorkflowsEnabled, isApprovalsEnabled, getWorkflowStateInfo, hasTransitionsForState } = useWorkflows();
  // derived values
  const parentState = getStateById(groupId);
  const projectId = parentState?.project_id;

  if (!workspaceSlug || !projectId || !groupId) return <></>;

  const isWorkflowEnabled = isWorkflowsEnabled(workspaceSlug.toString(), projectId);
  if (!isWorkflowEnabled) return <></>;

  const typeScopedInfo = getWorkflowStateInfo(workspaceSlug.toString(), projectId, typeId, groupId);
  const approvalsEnabled = isApprovalsEnabled(workspaceSlug.toString(), projectId);
  const isTransitionEnabledForState = hasTransitionsForState(workspaceSlug.toString(), projectId, groupId, typeId);
  const isTransitionEnabledForUser = user?.id
    ? (typeScopedInfo?.transitions ?? []).some((transition) => transition.member_ids.includes(user.id))
    : false;

  if (!isTransitionEnabledForState) return <></>;

  return (
    <Popover>
      <Popover.Trigger
        className={cn(
          "flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center overflow-hidden rounded-sm transition-all bg-layer-transparent hover:bg-layer-transparent-hover text-icon-primary",
          {
            "bg-[#00A0CC]/15": isTransitionEnabledForUser && approvalsEnabled,
          }
        )}
      >
        {isTransitionEnabledForUser && approvalsEnabled ? (
          <ApproverIcon width={14} strokeWidth={2} className="text-[#00A0CC]" />
        ) : (
          <WorkflowIcon width={14} strokeWidth={2} className="text-secondary" />
        )}
      </Popover.Trigger>
      <Popover.Content
        side="bottom"
        align="start"
        sideOffset={8}
        className="z-40 rounded-lg border border-subtle-1 bg-layer-2 shadow-overlay-200"
        positionerClassName="z-2"
      >
        <WorkFlowEnabledMessage parentStateId={groupId} typeId={typeId} />
      </Popover.Content>
    </Popover>
  );
});
