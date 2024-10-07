"use client";
import React, { FC } from "react";
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

export const IssueAttachmentsCollapsibleContent: FC<Props> = (props) => {
  const { workspaceSlug, projectId, issueId, disabled } = props;
  // helper
  const handleAttachmentOperations = useAttachmentOperations(workspaceSlug, projectId, issueId);
  return (
    <IssueAttachmentItemList
      workspaceSlug={workspaceSlug}
      issueId={issueId}
      disabled={disabled}
      handleAttachmentOperations={handleAttachmentOperations}
    />
  );
};
