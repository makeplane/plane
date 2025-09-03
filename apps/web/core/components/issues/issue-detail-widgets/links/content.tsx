"use client";
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
  issueServiceType: TIssueServiceType;
};

export const IssueLinksCollapsibleContent: React.FC<Props> = (props) => {
  const { workspaceSlug, projectId, issueId, disabled, issueServiceType } = props;

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
