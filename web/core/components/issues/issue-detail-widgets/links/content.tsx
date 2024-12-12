"use client";
import React, { FC } from "react";
import { EIssueServiceType } from "@plane/constants";
import { TIssueServiceType } from "@plane/types";
// components
import { LinkList } from "../../issue-detail/links";
// helper
import { useLinkOperations } from "./helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueServiceType?: TIssueServiceType;
};

export const IssueLinksCollapsibleContent: FC<Props> = (props) => {
  const { workspaceSlug, projectId, issueId, disabled, issueServiceType = EIssueServiceType.ISSUES } = props;

  // helper
  const handleLinkOperations = useLinkOperations(workspaceSlug, projectId, issueId, issueServiceType);

  return (
    <LinkList
      issueId={issueId}
      linkOperations={handleLinkOperations}
      disabled={disabled}
      issueServiceType={issueServiceType}
    />
  );
};
