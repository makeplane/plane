"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
// components
import {
  IssueAttachmentActionButton,
  IssueAttachmentsCollapsibleContent,
  IssueLinksActionButton,
  IssueLinksCollapsibleContent,
} from "@/components/issues/issue-detail-widgets";
// hooks
import { useIssueDetail } from "@/hooks/store";
// plane web
import { CollapsibleDetailSection } from "@/plane-web/components/common/layout/main/sections/collapsible-root";

type Props = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  disabled: boolean;
};

export const EpicCollapsibleSection: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, epicId, disabled } = props;
  // store hooks
  const {
    issue: { getIssueById },
    attachment: { getAttachmentsUploadStatusByIssueId },
    openWidgets,
    toggleOpenWidget,
  } = useIssueDetail(EIssueServiceType.EPICS);

  // derived values
  const epic = getIssueById(epicId);

  const attachmentUploads = getAttachmentsUploadStatusByIssueId(epicId);

  const shouldRenderLinks = !!epic?.link_count && epic?.link_count > 0;
  const shouldRenderAttachments =
    (!!epic?.attachment_count && epic?.attachment_count > 0) || (!!attachmentUploads && attachmentUploads.length > 0);

  const shouldRenderDetailsSection = shouldRenderLinks || shouldRenderAttachments;

  const linksCount = epic?.link_count ?? 0;
  const attachmentCount = epic?.attachment_count ?? 0;

  if (!shouldRenderDetailsSection) return <></>;

  return (
    <>
      {shouldRenderLinks && (
        <CollapsibleDetailSection
          title="Links"
          actionItemElement={
            !disabled && <IssueLinksActionButton issueServiceType={EIssueServiceType.EPICS} disabled={disabled} />
          }
          count={linksCount}
          collapsibleContent={
            <IssueLinksCollapsibleContent
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={epicId}
              disabled={disabled}
              issueServiceType={EIssueServiceType.EPICS}
            />
          }
          isOpen={openWidgets.includes("links")}
          onToggle={() => toggleOpenWidget("links")}
        />
      )}

      {shouldRenderAttachments && (
        <CollapsibleDetailSection
          title="Attachments"
          actionItemElement={
            !disabled && (
              <div className="pb-3">
                <IssueAttachmentActionButton
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  issueId={epicId}
                  disabled={disabled}
                  issueServiceType={EIssueServiceType.EPICS}
                />
              </div>
            )
          }
          count={attachmentCount}
          collapsibleContent={
            <IssueAttachmentsCollapsibleContent
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={epicId}
              disabled={disabled}
              issueServiceType={EIssueServiceType.EPICS}
            />
          }
          isOpen={openWidgets.includes("attachments")}
          onToggle={() => toggleOpenWidget("attachments")}
        />
      )}
    </>
  );
});
