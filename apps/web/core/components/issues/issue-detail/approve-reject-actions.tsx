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
import { CheckIcon, CloseIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";
// hooks
import { useUser } from "@/hooks/store/user";
import { useWorkflows } from "@/hooks/store/use-workflows";
// stores
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type Props = {
  projectId: string;
  workItemId: string;
  currentStateId: string;
  typeId?: string | null;
  workspaceSlug: string;
};

export const WorkItemApproveRejectActions = observer(function WorkItemApproveRejectActions(props: Props) {
  const { projectId, workItemId, currentStateId, typeId, workspaceSlug } = props;
  // state
  const [isLoading, setIsLoading] = useState<"approve" | "reject" | null>(null);
  // hooks
  const { t } = useTranslation();
  const { data: currentUser } = useUser();
  const { updateStateViaWorkflow } = useIssueDetail();
  const { isWorkflowsEnabled, isApprovalsEnabled, isApprovalPending, isCurrentUserApprover } = useWorkflows();
  // derived values
  const isEnabled = workspaceSlug ? isWorkflowsEnabled(workspaceSlug.toString(), projectId) : false;
  const isApprovalFeatureEnabled =
    isEnabled && workspaceSlug ? isApprovalsEnabled(workspaceSlug.toString(), projectId) : false;
  const isPending =
    isApprovalFeatureEnabled && workspaceSlug
      ? isApprovalPending(workspaceSlug.toString(), projectId, typeId, currentStateId)
      : false;
  const canApprove = useMemo(() => {
    return isPending && currentUser?.id && workspaceSlug
      ? isCurrentUserApprover(workspaceSlug.toString(), projectId, typeId, currentStateId, currentUser.id)
      : false;
  }, [isPending, currentUser?.id, workspaceSlug, projectId, typeId, currentStateId]);

  const handleAction = useCallback(
    async (action: "approve" | "reject") => {
      if (!workspaceSlug || isLoading) return;
      setIsLoading(action);
      try {
        await updateStateViaWorkflow(workspaceSlug.toString(), projectId, workItemId, action);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("toast.success"),
          message: action === "approve" ? "Approved" : "Rejected",
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
    [workspaceSlug, projectId, workItemId, isLoading, updateStateViaWorkflow, t]
  );

  if (!canApprove) return null;

  return (
    <div className="flex gap-2">
      <Button
        variant="success-outline"
        size="lg"
        prependIcon={<CheckIcon className="size-4" />}
        onClick={() => void handleAction("approve")}
        disabled={isLoading !== null}
        loading={isLoading === "approve"}
      >
        Approve
      </Button>
      <Button
        variant="error-outline"
        size="lg"
        prependIcon={<CloseIcon className="size-4" />}
        onClick={() => void handleAction("reject")}
        disabled={isLoading !== null}
        loading={isLoading === "reject"}
      >
        Reject
      </Button>
    </div>
  );
});
