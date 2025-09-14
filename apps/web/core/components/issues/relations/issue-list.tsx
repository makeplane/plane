"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { EIssueServiceType, TIssue, TIssueServiceType } from "@plane/types";
// Plane-web imports
import { TIssueRelationTypes } from "@/plane-web/types";
// local imports
import { RelationIssueListItem } from "./issue-list-item";

type Props = {
  workspaceSlug: string;
  issueId: string;
  issueIds: string[];
  relationKey: TIssueRelationTypes;
  handleIssueCrudState: (
    key: "update" | "delete" | "removeRelation",
    issueId: string,
    issue?: TIssue | null,
    relationKey?: TIssueRelationTypes | null,
    relationIssueId?: string | null
  ) => void;
  disabled?: boolean;
  issueServiceType?: TIssueServiceType;
};

export const RelationIssueList: FC<Props> = observer((props) => {
  const {
    workspaceSlug,
    issueId,
    issueIds,
    relationKey,
    disabled = false,
    handleIssueCrudState,
    issueServiceType = EIssueServiceType.ISSUES,
  } = props;

  return (
    <div className="relative">
      {issueIds &&
        issueIds.length > 0 &&
        issueIds.map((relationIssueId) => (
          <RelationIssueListItem
            key={relationIssueId}
            workspaceSlug={workspaceSlug}
            issueId={issueId}
            relationKey={relationKey}
            relationIssueId={relationIssueId}
            disabled={disabled}
            handleIssueCrudState={handleIssueCrudState}
            issueServiceType={issueServiceType}
          />
        ))}
    </div>
  );
});
