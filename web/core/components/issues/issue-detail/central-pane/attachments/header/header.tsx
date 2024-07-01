"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { Paperclip } from "lucide-react";
// components
import {
  CentralPaneHeaderActionButton,
  IssueAttachmentActionButton,
} from "@/components/issues/issue-detail/central-pane";
// hooks
import { useIssueDetail } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
};

export const AttachmentsHeader: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled = false } = props;
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  // derived value
  const issue = getIssueById(issueId);

  // button render conditions
  const attachmentCount = issue?.attachment_count;

  return (
    <IssueAttachmentActionButton
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      issueId={issueId}
      disabled={disabled}
      customButton={
        <CentralPaneHeaderActionButton
          title={attachmentCount && attachmentCount > 0 ? `${attachmentCount}` : "Attachments"}
          icon={<Paperclip className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-300" />}
        />
      }
    />
  );
});
