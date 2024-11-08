"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { useAttachmentOperations } from "../issue-detail-widgets/attachments/helper";
// components
import { IssueAttachmentUpload } from "./attachment-upload";
import { IssueAttachmentsList } from "./attachments-list";

export type TIssueAttachmentRoot = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
};

export const IssueAttachmentRoot: FC<TIssueAttachmentRoot> = observer((props) => {
  // props
  const { workspaceSlug, projectId, issueId, disabled = false } = props;
  // hooks
  const attachmentHelpers = useAttachmentOperations(workspaceSlug, projectId, issueId);

  return (
    <div className="relative py-3 space-y-3">
      <h3 className="text-lg">Attachments</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <IssueAttachmentUpload
          workspaceSlug={workspaceSlug}
          disabled={disabled}
          attachmentOperations={attachmentHelpers.operations}
        />
        <IssueAttachmentsList issueId={issueId} disabled={disabled} attachmentHelpers={attachmentHelpers} />
      </div>
    </div>
  );
});
