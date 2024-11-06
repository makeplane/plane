"use client";
import React, { FC, useState } from "react";
import { observer } from "mobx-react";
// helpers
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useIssueDetail } from "@/hooks/store";

type TCreateIssueToastActionItems = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

export const CreateIssueToastActionItems: FC<TCreateIssueToastActionItems> = observer((props) => {
  const { workspaceSlug, projectId, issueId } = props;
  // state
  const [copied, setCopied] = useState(false);
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  // derived values
  const issue = getIssueById(issueId);

  if (!issue) return null;

  const issueLink = `${workspaceSlug}/projects/${projectId}/issues/${issueId}`;

  const copyToClipboard = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    try {
      await copyUrlToClipboard(issueLink);
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
        href={`/${workspaceSlug}/projects/${projectId}/issues/${issueId}/`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-custom-primary px-2 py-1 hover:bg-custom-background-90 font-medium rounded"
      >
        View issue
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
