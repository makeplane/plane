"use client";
import React, { FC, useState } from "react";
import { Collapsible } from "@plane/ui";
// components
import { SubIssuesCollapsibleContent, SubIssuesCollapsibleTitle } from "@/components/issues/issue-detail-widgets";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
};

export const SubIssuesCollapsible: FC<Props> = (props) => {
  const { workspaceSlug, projectId, issueId, disabled = false } = props;
  // state
  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
    <Collapsible
      isOpen={isOpen}
      onToggle={() => setIsOpen((prev) => !prev)}
      title={
        <SubIssuesCollapsibleTitle
          isOpen={isOpen}
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
};
