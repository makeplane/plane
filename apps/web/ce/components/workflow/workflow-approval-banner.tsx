/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { setPromiseToast } from "@plane/propel/toast";
import { Button } from "@plane/ui";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useWorkflow } from "@/hooks/store/use-workflow";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

export const WorkflowApprovalBanner = observer(function WorkflowApprovalBanner(props: Props) {
  const { workspaceSlug, projectId, issueId } = props;
  const { t } = useTranslation();
  const workflowStore = useWorkflow();
  const { fetchIssue } = useIssueDetail();

  const status = workflowStore.getIssueWorkflowStatus(issueId);
  const pendingApproval = status?.pending_approval;

  useEffect(() => {
    workflowStore.fetchIssueWorkflowStatus(workspaceSlug, projectId, issueId).catch(() => undefined);
  }, [workspaceSlug, projectId, issueId, workflowStore]);

  if (status && !status.is_workflow_enabled) return null;

  const hasPendingApproval =
    Boolean(status?.blocker_message) ||
    pendingApproval?.status === "pending" ||
    Boolean(pendingApproval?.id && !pendingApproval.resolved_at);

  if (!hasPendingApproval) return null;

  const canResolve = Boolean(pendingApproval?.id);

  const handleResolve = async (action: "approve" | "reject") => {
    if (!pendingApproval?.id) return;
    const promise = workflowStore
      .resolveApproval(workspaceSlug, projectId, issueId, pendingApproval.id, action)
      .then(() => fetchIssue(workspaceSlug, projectId, issueId));

    setPromiseToast(promise, {
      loading: t("project_settings.workflows.resolving_approval"),
      success: {
        title: t("common.success"),
        message: () =>
          action === "approve"
            ? t("project_settings.workflows.approved_success")
            : t("project_settings.workflows.rejected_success"),
      },
      error: {
        title: t("common.error.label"),
        message: () => t("project_settings.workflows.approval_error"),
      },
    });
    await promise;
  };

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-accent-strong bg-accent-primary/10 px-4 py-3">
      <div>
        <p className="text-13 font-medium text-primary">{t("project_settings.workflows.pending_approval_title")}</p>
        <p className="mt-0.5 text-11 text-secondary">
          {t("project_settings.workflows.pending_approval_description", {
            from: pendingApproval?.source_state_detail?.name ?? "",
            to: pendingApproval?.approve_state_detail?.name ?? "",
          })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="neutral-primary" size="sm" onClick={() => handleResolve("reject")} disabled={!canResolve}>
          {t("reject")}
        </Button>
        <Button variant="primary" size="sm" onClick={() => handleResolve("approve")} disabled={!canResolve}>
          {t("approve")}
        </Button>
      </div>
    </div>
  );
});
