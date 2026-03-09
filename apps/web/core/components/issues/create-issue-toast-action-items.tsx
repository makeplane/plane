/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { copyTextToClipboard, copyUrlToClipboard, generateWorkItemLink } from "@plane/utils";
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
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectIdentifierById } = useProject();

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
    e.preventDefault();
    e.stopPropagation();
    try {
      await copyUrlToClipboard(workItemLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (_error) {
      setCopiedLink(false);
    }
  };

  const workItemId = `${projectIdentifier}-${issue?.sequence_id}`;

  const copyWorkItemId = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await copyTextToClipboard(workItemId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 3000);
    } catch (_error) {
      setCopiedId(false);
    }
  };

  return (
    <div className="-ml-2 flex items-center gap-1 text-11 text-secondary">
      <span className="rounded-sm px-2 py-1 font-medium text-secondary">{workItemId}</span>

      {copiedId ? (
        <span className="cursor-default px-2 py-1 text-secondary">Copied!</span>
      ) : (
        <button
          className="cursor-pointer rounded-sm px-2 py-1 text-tertiary hover:bg-surface-2 hover:text-secondary"
          onClick={copyWorkItemId}
        >
          Copy ID
        </button>
      )}

      <a
        href={workItemLink}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-sm px-2 py-1 font-medium text-accent-primary hover:bg-surface-2"
      >
        {`View ${isEpic ? "epic" : "work item"}`}
      </a>

      {copiedLink ? (
        <span className="cursor-default px-2 py-1 text-secondary">Link Copied!</span>
      ) : (
        <button
          className="cursor-pointer rounded-sm px-2 py-1 text-tertiary opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-surface-2 hover:text-secondary focus:opacity-100"
          onClick={copyToClipboard}
        >
          Copy link
        </button>
      )}
    </div>
  );
});
