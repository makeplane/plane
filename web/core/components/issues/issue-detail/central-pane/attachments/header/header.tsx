"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { Paperclip } from "lucide-react";
// components
import {
  CentralPaneHeaderActionButton,
  IssueAttachmentActionButton,
} from "@/components/issues/issue-detail/central-pane";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
};

export const AttachmentsHeader: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled = false } = props;

  return (
    <IssueAttachmentActionButton
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      issueId={issueId}
      disabled={disabled}
      customButton={
        <CentralPaneHeaderActionButton
          title="Attach"
          icon={<Paperclip className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-300" />}
        />
      }
    />
  );
});
