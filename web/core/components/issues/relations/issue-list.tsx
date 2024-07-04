"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { TIssue, TIssueRelationTypes } from "@plane/types";
// components
import { RelationIssueListItem } from "@/components/issues/relations";
// types
import { TRelationIssueOperations } from "../issue-detail-widgets/relations/helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueIds: string[];
  relationKey: TIssueRelationTypes;
  issueOperations: TRelationIssueOperations;
  handleIssueCrudState: (key: "update" | "delete", issueId: string, issue?: TIssue | null) => void;
  disabled?: boolean;
};

export const RelationIssueList: FC<Props> = observer((props) => {
  const {
    workspaceSlug,
    projectId,
    issueId,
    issueIds,
    relationKey,
    disabled = false,
    issueOperations,
    handleIssueCrudState,
  } = props;

  return (
    <div className="relative">
      {issueIds &&
        issueIds.length > 0 &&
        issueIds.map((relationIssueId) => (
          <RelationIssueListItem
            key={relationIssueId}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
            relationKey={relationKey}
            relationIssueId={relationIssueId}
            disabled={disabled}
            handleIssueCrudState={handleIssueCrudState}
            issueOperations={issueOperations}
          />
        ))}
    </div>
  );
});
