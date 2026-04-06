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

import { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@plane/propel/button";
import { CheckCircleFilledIcon, CloseCircleFilledIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";
import { useUser } from "@/hooks/store/user";
import { useWorkflows } from "@/hooks/store/use-workflows";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { WorkItemApprovalPendingIndicator } from "./approval-pending-indicator";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import type { TIssue, TIssueServiceType } from "@plane/types";
import { useIssuesActions } from "@/hooks/use-issues-actions";

type Props = {
  projectId: string;
  workItemId: string;
  currentStateId: string;
  typeId?: string | null;
  workspaceSlug: string;
  serviceType: TIssueServiceType;
};

export const WorkItemApproveRejectActions = observer(function WorkItemApproveRejectActions(props: Props) {
  const { projectId, workItemId, currentStateId, typeId, workspaceSlug, serviceType } = props;
  // state
  const [isLoading, setIsLoading] = useState<"approve" | "reject" | null>(null);
  const { t } = useTranslation();
  const { data: currentUser } = useUser();
  const {
    updateStateViaWorkflow,
    issue: { getIssueById },
  } = useIssueDetail(serviceType);
  const { getProjectIdentifierById } = useProject();
  const { getStateById } = useProjectState();
  const { isApprovalPending, isCurrentUserApprover } = useWorkflows();
  const isPending = isApprovalPending(workspaceSlug, projectId, typeId, currentStateId);
  const workItemStoreType = useIssueStoreType();
  const { updateIssue } = useIssuesActions(workItemStoreType);
  // derived values
  const projectIdentifier = getProjectIdentifierById(projectId);
  const workItemDetails = getIssueById(workItemId);
  const canApprove = useMemo(() => {
    return isPending && currentUser?.id
      ? isCurrentUserApprover(workspaceSlug, projectId, typeId, currentStateId, currentUser.id)
      : false;
  }, [currentStateId, currentUser?.id, isCurrentUserApprover, isPending, projectId, typeId, workspaceSlug]);

  const handleAction = useCallback(
    async (action: "approve" | "reject") => {
      if (!workspaceSlug || isLoading) return;

      setIsLoading(action);
      try {
        const newStateId = await updateStateViaWorkflow(
          workspaceSlug.toString(),
          projectId,
          workItemId,
          action,
          updateIssue ? (data: Partial<TIssue>) => updateIssue(projectId, workItemId, data, false) : undefined
        );
        const newStateDetail = getStateById(newStateId);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: `${projectIdentifier}-${workItemDetails?.sequence_id} ${action === "approve" ? "Approved" : "Rejected"}`,
          message: `Work item is moved to ${newStateDetail?.name}`,
        });
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: action === "approve" ? "Failed to approve work item" : "Failed to reject work item",
        });
      } finally {
        setIsLoading(null);
      }
    },
    [
      getStateById,
      isLoading,
      projectId,
      projectIdentifier,
      t,
      updateStateViaWorkflow,
      workItemDetails?.sequence_id,
      workItemId,
      workspaceSlug,
      updateIssue,
    ]
  );

  if (!isPending) return null;
  if (!canApprove) return <WorkItemApprovalPendingIndicator />;

  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="lg"
        onClick={() => void handleAction("approve")}
        disabled={isLoading !== null}
        loading={isLoading === "approve"}
      >
        <CheckCircleFilledIcon className="size-4 shrink-0 text-success-secondary" />
        Approve
      </Button>
      <Button
        variant="secondary"
        size="lg"
        onClick={() => void handleAction("reject")}
        disabled={isLoading !== null}
        loading={isLoading === "reject"}
      >
        <CloseCircleFilledIcon className="size-4 shrink-0 text-danger-secondary" />
        Reject
      </Button>
    </div>
  );
});
