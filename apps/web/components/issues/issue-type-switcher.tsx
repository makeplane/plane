/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
// store hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
// components
import { IssueTypeDropdown } from "@/components/dropdowns/issue-type";
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";

export type TIssueTypeSwitcherProps = {
  issueId: string;
  disabled: boolean;
};

export const IssueTypeSwitcher = observer(function IssueTypeSwitcher(props: TIssueTypeSwitcherProps) {
  const { issueId, disabled } = props;
  // router
  const { workspaceSlug } = useParams();
  // i18n
  const { t } = useTranslation();
  // store hooks
  const {
    issue: { getIssueById },
    updateIssue,
  } = useIssueDetail();
  const { getProjectById } = useProject();
  // derived values
  const issue = getIssueById(issueId);
  const projectId = issue?.project_id;

  if (!issue || !projectId) return <></>;

  const isIssueTypeEnabled = getProjectById(projectId)?.is_issue_type_enabled ?? false;

  const handleTypeChange = async (typeId: string | null) => {
    if (!workspaceSlug) return;
    try {
      await updateIssue(workspaceSlug.toString(), projectId, issueId, { type_id: typeId });
    } catch (error) {
      console.error("Error in updating work item type:", error);
      setToast({
        title: t("common.error.label"),
        type: "error",
        message: t("entity.update.failed", { entity: t("issue.label") }),
      });
    }
  };

  return (
    <div className="flex min-w-0 items-center gap-3">
      <IssueIdentifier issueId={issueId} projectId={projectId} size="md" enableClickToCopyIdentifier />
      {isIssueTypeEnabled && (
        <IssueTypeDropdown
          value={issue.type_id}
          onChange={handleTypeChange}
          projectId={projectId}
          workspaceSlug={workspaceSlug?.toString() ?? ""}
          disabled={disabled}
          testId="work-item-type-switcher"
        />
      )}
    </div>
  );
});
