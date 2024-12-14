"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
import { TIssueServiceType } from "@plane/types";
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
  issueServiceType?: TIssueServiceType;
};

export const SubIssuesCollapsible: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled = false, issueServiceType = EIssueServiceType.ISSUES } = props;

  // store hooks
  const { openWidgets, toggleOpenWidget } = useIssueDetail(issueServiceType);

  // derived state
  const isCollapsibleOpen = openWidgets.includes("sub-issues");

  return (
    <Collapsible
      isOpen={isCollapsibleOpen}
      onToggle={() => toggleOpenWidget("sub-issues")}
      title={
        <SubIssuesCollapsibleTitle
          isOpen={isCollapsibleOpen}
          parentIssueId={issueId}
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      }
      buttonClassName="w-full"
    >
      <SubIssuesCollapsibleContent
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        parentIssueId={issueId}
        disabled={disabled}
        issueServiceType={issueServiceType}
      />
    </Collapsible>
  );
});
