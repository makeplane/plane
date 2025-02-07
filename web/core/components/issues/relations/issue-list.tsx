"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
// Plane
import { EIssueServiceType } from "@plane/constants";
import { TIssue, TIssueServiceType } from "@plane/types";
// components
import { RelationIssueListItem } from "@/components/issues/relations";
// Plane-web
import { TIssueRelationTypes } from "@/plane-web/types";

type Props = {
  workspaceSlug: string;
  issueId: string;
  issueIds: string[];
  relationKey: TIssueRelationTypes;
  handleIssueCrudState: (key: "update" | "delete", issueId: string, issue?: TIssue | null) => void;
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
