"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { Collapsible } from "@plane/ui";
// components
import { IssueLinksCollapsibleContent, IssueLinksCollapsibleTitle } from "@/components/issues/issue-detail-widgets";
// hooks
import { useIssueDetail } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
};

export const LinksCollapsible: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled = false } = props;
  // store hooks
  const { activeIssueDetailWidgets, toggleActiveIssueDetailWidget } = useIssueDetail();

  // derived values
  const isCollapsibleOpen = activeIssueDetailWidgets.includes("links");

  return (
    <Collapsible
      isOpen={isCollapsibleOpen}
      onToggle={() => toggleActiveIssueDetailWidget("links")}
      title={
        <IssueLinksCollapsibleTitle
          isOpen={isCollapsibleOpen}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          disabled={disabled}
        />
      }
    >
      <IssueLinksCollapsibleContent
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        disabled={disabled}
      />
    </Collapsible>
  );
});
