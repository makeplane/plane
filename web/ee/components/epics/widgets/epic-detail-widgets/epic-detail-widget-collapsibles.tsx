"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
// components
import { AttachmentsCollapsible, LinksCollapsible } from "@/components/issues/issue-detail-widgets";
// hooks
import { useIssueDetail } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  disabled: boolean;
};

export const EpicDetailWidgetCollapsibles: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, epicId, disabled } = props;
  // store hooks
  const {
    issue: { getIssueById },
    attachment: { getAttachmentsUploadStatusByIssueId },
  } = useIssueDetail(EIssueServiceType.EPICS);

  // derived values
  const issue = getIssueById(epicId);

  // render conditions
  const shouldRenderLinks = !!issue?.link_count && issue?.link_count > 0;
  const attachmentUploads = getAttachmentsUploadStatusByIssueId(epicId);
  const shouldRenderAttachments =
    (!!issue?.attachment_count && issue?.attachment_count > 0) || (!!attachmentUploads && attachmentUploads.length > 0);

  return (
    <div className="flex flex-col">
      {shouldRenderLinks && (
        <LinksCollapsible
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={epicId}
          disabled={disabled}
          issueServiceType={EIssueServiceType.EPICS}
        />
      )}
      {shouldRenderAttachments && (
        <AttachmentsCollapsible
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={epicId}
          disabled={disabled}
          issueServiceType={EIssueServiceType.EPICS}
        />
      )}
    </div>
  );
});
