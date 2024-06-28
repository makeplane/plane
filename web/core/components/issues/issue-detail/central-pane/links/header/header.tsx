"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { Link } from "lucide-react";
// components
import { CentralPaneHeaderActionButton, IssueLinksActionButton } from "@/components/issues/issue-detail/central-pane";
// hooks
import { useIssueDetail } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
};

export const LinksHeader: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled = false } = props;
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  // derived value
  const issue = getIssueById(issueId);

  // button render conditions
  const linkCount = issue?.link_count;

  return (
    <IssueLinksActionButton
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      issueId={issueId}
      disabled={disabled}
      customButton={
        <CentralPaneHeaderActionButton
          title={linkCount && linkCount > 0 ? `${linkCount}` : "Links"}
          icon={<Link className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-300" />}
        />
      }
    />
  );
});
