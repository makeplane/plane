"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { Rocket } from "lucide-react";
// plane imports
import { ISearchIssueResponse } from "@plane/types";
import { generateWorkItemLink } from "@plane/utils";
// components
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";
// hooks
import { useIssueTypes } from "@/plane-web/hooks/store";

type Props = {
  workspaceSlug: string;
  issue: ISearchIssueResponse;
};

export const ParentIssuesListItem: FC<Props> = observer((props) => {
  const { workspaceSlug, issue } = props;

  const { getIssueTypeById } = useIssueTypes();

  const isParentEpic = getIssueTypeById(issue?.type_id || "")?.is_epic;

  return (
    <>
      <div className="flex flex-grow items-center gap-2 truncate">
        <span
          className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
          style={{
            backgroundColor: issue.state__color,
          }}
        />
        <span className="flex-shrink-0">
          <IssueIdentifier
            projectId={issue.project_id}
            issueTypeId={issue.type_id}
            projectIdentifier={issue.project__identifier}
            issueSequenceId={issue.sequence_id}
            textContainerClassName="text-xs text-custom-text-200"
          />
        </span>{" "}
        <span className="truncate">{issue.name}</span>
      </div>
      <a
        href={generateWorkItemLink({
          workspaceSlug: workspaceSlug.toString(),
          projectId: issue?.project_id,
          issueId: issue?.id,
          projectIdentifier: issue.project__identifier,
          sequenceId: issue?.sequence_id,
          isEpic: isParentEpic,
        })}
        target="_blank"
        className="z-1 relative hidden flex-shrink-0 text-custom-text-200 hover:text-custom-text-100 group-hover:block"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        <Rocket className="h-4 w-4" />
      </a>
    </>
  );
});
