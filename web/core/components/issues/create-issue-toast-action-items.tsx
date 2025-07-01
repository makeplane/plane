"use client";
import React, { FC, useState } from "react";
import { observer } from "mobx-react";
import { copyUrlToClipboard, generateWorkItemLink } from "@plane/utils";
// plane imports
// helpers
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";

type TCreateIssueToastActionItems = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  isEpic?: boolean;
};

export const CreateIssueToastActionItems: FC<TCreateIssueToastActionItems> = observer((props) => {
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
    <div className="flex items-center gap-1 text-xs text-custom-text-200">
      <a
        href={workItemLink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-custom-primary px-2 py-1 hover:bg-custom-background-90 font-medium rounded"
      >
        {`View ${isEpic ? "epic" : "work item"}`}
      </a>

      {copied ? (
        <>
          <span className="cursor-default px-2 py-1 text-custom-text-200">Copied!</span>
        </>
      ) : (
        <>
          <button
            className="cursor-pointer hidden group-hover:flex px-2 py-1 text-custom-text-300 hover:text-custom-text-200 hover:bg-custom-background-90 rounded"
            onClick={copyToClipboard}
          >
            Copy link
          </button>
        </>
      )}
    </div>
  );
});
