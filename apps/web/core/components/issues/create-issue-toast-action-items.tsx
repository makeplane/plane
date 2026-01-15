import type { FC } from "react";
import React, { useState } from "react";
import { observer } from "mobx-react";
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
  const { workspaceSlug, projectId, issueId, isEpic = false } = props;
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
    } catch (error) {
      setCopied(false);
    }
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="flex items-center gap-1 text-11 text-secondary -ml-2">
      <a
        href={workItemLink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent-primary px-2 py-1 hover:bg-surface-2 font-medium rounded-sm"
      >
        {`View ${isEpic ? "epic" : "work item"}`}
      </a>

      {copied ? (
        <>
          <span className="cursor-default px-2 py-1 text-secondary">Copied!</span>
        </>
      ) : (
        <>
          <button
            className="cursor-pointer hidden group-hover:flex px-2 py-1 text-tertiary hover:text-secondary hover:bg-surface-2 rounded-sm"
            onClick={copyToClipboard}
          >
            Copy link
          </button>
        </>
      )}
    </div>
  );
});
