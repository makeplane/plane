"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { Collapsible } from "@plane/ui";
// components
import {
  IssueAttachmentsCollapsibleContent,
  IssueAttachmentsCollapsibleTitle,
} from "@/components/issues/issue-detail-widgets";
// hooks
import { useIssueDetail } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
};

export const AttachmentsCollapsible: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled = false } = props;
  // store hooks
  const { openWidgets, toggleOpenWidget } = useIssueDetail();

  // derived values
  const isCollapsibleOpen = openWidgets.includes("attachments");

  return (
    <Collapsible
      isOpen={isCollapsibleOpen}
      onToggle={() => toggleOpenWidget("attachments")}
      title={
        <IssueAttachmentsCollapsibleTitle
          isOpen={isCollapsibleOpen}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          disabled={disabled}
        />
      }
      buttonClassName="w-full"
    >
      <IssueAttachmentsCollapsibleContent
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        disabled={disabled}
      />
    </Collapsible>
  );
});
