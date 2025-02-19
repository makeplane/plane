"use client";

import React from "react";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { IssueParentSelect, TIssueOperations } from "@/components/issues";
import { useSubIssueOperations } from "@/components/issues/issue-detail-widgets/sub-issues/helper";
// hooks
import { useIssueDetail } from "@/hooks/store";
import { useIssueTypes } from "@/plane-web/hooks/store";

type TIssueParentSelect = {
  className?: string;
  disabled?: boolean;
  issueId: string;
  issueOperations: TIssueOperations;
  projectId: string;
  workspaceSlug: string;
};

export const IssueParentSelectRoot: React.FC<TIssueParentSelect> = observer((props) => {
  const { issueId, issueOperations, projectId, workspaceSlug } = props;
  const { t } = useTranslation();
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const {
    toggleParentIssueModal,
    removeSubIssue,
    subIssues: { setSubIssueHelpers, fetchSubIssues },
  } = useIssueDetail();
  const { getIssueTypeById } = useIssueTypes();
  const subIssueOperations = useSubIssueOperations(EIssueServiceType.EPICS);

  // derived values
  const issue = getIssueById(issueId);
  const parentIssue = issue?.parent_id ? getIssueById(issue.parent_id) : undefined;
  const isParentEpic = getIssueTypeById(parentIssue?.type_id || "")?.is_epic;

  const handleParentIssue = async (_issueId: string | null = null) => {
    try {
      const issueBeforeUpdate = { ...issue };
      const oldParentDetails = issueBeforeUpdate?.parent_id ? getIssueById(issueBeforeUpdate.parent_id) : undefined;
      const isOldParentEpic = getIssueTypeById(oldParentDetails?.type_id || "")?.is_epic;
      await issueOperations.update(workspaceSlug, projectId, issueId, { parent_id: _issueId });
      await issueOperations.fetch(workspaceSlug, projectId, issueId, false);
      if (_issueId) await fetchSubIssues(workspaceSlug, projectId, _issueId);
      if (isOldParentEpic && oldParentDetails?.id)
        await subIssueOperations.removeSubIssue(workspaceSlug, projectId, oldParentDetails.id, issueId);
      toggleParentIssueModal(null);
    } catch (error) {
      console.error("something went wrong while fetching the issue");
    }
  };

  const handleRemoveSubIssue = async (
    workspaceSlug: string,
    projectId: string,
    parentIssueId: string,
    issueId: string
  ) => {
    try {
      const issueBeforeUpdate = { ...issue };
      const oldParentDetails = issueBeforeUpdate?.parent_id ? getIssueById(issueBeforeUpdate.parent_id) : undefined;
      const isOldParentEpic = getIssueTypeById(oldParentDetails?.type_id || "")?.is_epic;
      setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
      await removeSubIssue(workspaceSlug, projectId, parentIssueId, issueId);
      await fetchSubIssues(workspaceSlug, projectId, parentIssueId);
      if (isOldParentEpic && oldParentDetails?.id)
        await subIssueOperations.removeSubIssue(workspaceSlug, projectId, oldParentDetails.id, issueId);
      setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error.label"),
        message: t("common.something_went_wrong"),
      });
    }
  };

  const workItemLink = `/${workspaceSlug}/projects/${parentIssue?.project_id}/${isParentEpic ? "epics" : "issues"}/${parentIssue?.id}`;

  if (!issue) return <></>;

  return (
    <IssueParentSelect
      {...props}
      handleParentIssue={handleParentIssue}
      handleRemoveSubIssue={handleRemoveSubIssue}
      workItemLink={workItemLink}
    />
  );
});
