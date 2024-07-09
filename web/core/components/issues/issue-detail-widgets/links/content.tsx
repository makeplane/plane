"use client";
import React, { FC } from "react";
// components
import { LinkList } from "../../issue-detail/links";
// helper
import { useLinkOperations } from "./helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const IssueLinksCollapsibleContent: FC<Props> = (props) => {
  const { workspaceSlug, projectId, issueId, disabled } = props;

  // helper
  const handleLinkOperations = useLinkOperations(workspaceSlug, projectId, issueId);

  return <LinkList issueId={issueId} linkOperations={handleLinkOperations} disabled={disabled} />;
};
