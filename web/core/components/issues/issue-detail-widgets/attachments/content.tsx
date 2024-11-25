"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
// components
import { IssueAttachmentItemList } from "@/components/issues/attachment";
// helper
import { useAttachmentOperations } from "./helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const IssueAttachmentsCollapsibleContent: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled } = props;
  // helper
  const attachmentHelpers = useAttachmentOperations(workspaceSlug, projectId, issueId);
  return (
    <IssueAttachmentItemList
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      issueId={issueId}
      disabled={disabled}
      attachmentHelpers={attachmentHelpers}
    />
  );
});
