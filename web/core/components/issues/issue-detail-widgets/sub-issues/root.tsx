"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { Collapsible } from "@plane/ui";
// components
import { SubIssuesCollapsibleContent, SubIssuesCollapsibleTitle } from "@/components/issues/issue-detail-widgets";
// hooks
import { useIssueDetail } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
};

export const SubIssuesCollapsible: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled = false } = props;

  // store hooks
  const { activeIssueDetailWidgets, toggleActiveIssueDetailWidget } = useIssueDetail();

  // derived state
  const isCollapsibleOpen = activeIssueDetailWidgets.includes("sub-issues");

  return (
    <Collapsible
      isOpen={isCollapsibleOpen}
      onToggle={() => toggleActiveIssueDetailWidget("sub-issues")}
      title={
        <SubIssuesCollapsibleTitle
          isOpen={isCollapsibleOpen}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          parentIssueId={issueId}
          disabled={disabled}
        />
      }
    >
      <SubIssuesCollapsibleContent
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        parentIssueId={issueId}
        disabled={disabled}
      />
    </Collapsible>
  );
});
