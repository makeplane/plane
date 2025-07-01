"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType, TIssueServiceType } from "@plane/types";
// components
import { IssueAttachmentItemList } from "@/components/issues/attachment";
// helper
import { useAttachmentOperations } from "./helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueServiceType?: TIssueServiceType;
};

export const IssueAttachmentsCollapsibleContent: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled, issueServiceType = EIssueServiceType.ISSUES } = props;
  // helper
  const attachmentHelpers = useAttachmentOperations(workspaceSlug, projectId, issueId, issueServiceType);
  return (
    <IssueAttachmentItemList
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      issueId={issueId}
      disabled={disabled}
      attachmentHelpers={attachmentHelpers}
      issueServiceType={issueServiceType}
    />
  );
});
