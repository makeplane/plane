/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { copyUrlToClipboard, generateWorkItemLink } from "@plane/utils";
// plane imports
// helpers
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";

type TCreateIssueToastActionItems = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  isEpic?: boolean;
};

export const CreateIssueToastActionItems = observer(function CreateIssueToastActionItems(
  props: TCreateIssueToastActionItems
) {
  const { workspaceSlug, issueId, isEpic = false } = props;
  const { t } = useTranslation();
  // state
  const [copied, setCopied] = useState(false);
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectIdentifierById } = useProject();

  // derived values
  const issue = getIssueById(issueId);
  const projectIdentifier = getProjectIdentifierById(issue?.project_id);

  if (!issue) return null;

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: issue?.project_id,
    issueId,
    projectIdentifier,
    sequenceId: issue?.sequence_id,
    isEpic,
  });

  const copyToClipboard = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    try {
      await copyUrlToClipboard(workItemLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (_error) {
      setCopied(false);
    }
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="-ml-2 flex items-center gap-1 text-11 text-secondary">
      <a
        href={workItemLink}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-sm px-2 py-1 font-medium text-accent-primary hover:bg-surface-2"
      >
        {isEpic ? t("issue_ui.view_epic") : t("issue_ui.view_work_item")}
      </a>

      {copied ? (
        <>
          <span className="cursor-default px-2 py-1 text-secondary">{t("common.copied")}</span>
        </>
      ) : (
        <>
          <button
            className="hidden cursor-pointer rounded-sm px-2 py-1 text-tertiary group-hover:flex hover:bg-surface-2 hover:text-secondary"
            onClick={copyToClipboard}
          >
            {t("common.actions.copy_link")}
          </button>
        </>
      )}
    </div>
  );
});
