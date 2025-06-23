"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { TIssueServiceType } from "@plane/types";
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
  issueServiceType: TIssueServiceType;
};

export const LinksCollapsible: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled = false, issueServiceType } = props;
  // store hooks
  const { openWidgets, toggleOpenWidget } = useIssueDetail(issueServiceType);
  // derived values
  const isCollapsibleOpen = openWidgets.includes("links");

  return (
    <Collapsible
      isOpen={isCollapsibleOpen}
      onToggle={() => toggleOpenWidget("links")}
      title={
        <IssueLinksCollapsibleTitle
          isOpen={isCollapsibleOpen}
          issueId={issueId}
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      }
      buttonClassName="w-full"
    >
      <IssueLinksCollapsibleContent
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        disabled={disabled}
        issueServiceType={issueServiceType}
      />
    </Collapsible>
  );
});
