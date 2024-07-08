"use client";
import React, { FC, useState } from "react";
import { Collapsible } from "@plane/ui";
// components
import { IssueLinksCollapsibleContent, IssueLinksCollapsibleTitle } from "@/components/issues/issue-detail-widgets";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
};

export const LinksCollapsible: FC<Props> = (props) => {
  const { workspaceSlug, projectId, issueId, disabled = false } = props;
  // state
  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
    <Collapsible
      isOpen={isOpen}
      onToggle={() => setIsOpen((prev) => !prev)}
      title={
        <IssueLinksCollapsibleTitle
          isOpen={isOpen}
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
};
