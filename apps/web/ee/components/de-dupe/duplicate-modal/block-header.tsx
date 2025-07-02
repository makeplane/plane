"use-client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { TDeDupeIssue } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store";
// components
import { IssueIdentifier } from "@/plane-web/components/issues";
// types

type DuplicateIssueReadOnlyHeaderRoot = {
  issue: TDeDupeIssue;
};

export const DuplicateIssueReadOnlyHeaderRoot: FC<DuplicateIssueReadOnlyHeaderRoot> = observer((props) => {
  const { issue } = props;
  // store
  const { getProjectById } = useProject();
  // derived values
  const projectDetails = getProjectById(issue?.project_id);
  const projectIdentifier = projectDetails?.identifier ?? "";

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 ">
          <IssueIdentifier
            issueSequenceId={issue.sequence_id}
            projectIdentifier={projectIdentifier}
            issueTypeId={issue.type_id}
            projectId={issue.project_id}
            textContainerClassName="text-xs font-medium text-custom-text-300"
            size="xs"
            displayProperties={{
              key: true,
              issue_type: true,
            }}
          />
        </div>
      </div>
    </>
  );
});
