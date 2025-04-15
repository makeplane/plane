"use client";
import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { CollapsibleButton } from "@plane/ui";
// components
import { IssueAttachmentActionButton } from "@/components/issues/issue-detail-widgets";
// hooks
import { useIssueDetail } from "@/hooks/store";
import { useTranslation } from "@plane/i18n";

type Props = {
  isOpen: boolean;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const IssueAttachmentsCollapsibleTitle: FC<Props> = observer((props) => {
  const { isOpen, workspaceSlug, projectId, issueId, disabled } = props;
  const { t } = useTranslation();
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  // derived values
  const issue = getIssueById(issueId);
  const attachmentCount = issue?.attachment_count ?? 0;

  // indicator element
  const indicatorElement = useMemo(
    () => (
      <span className="flex items-center justify-center ">
        <p className="text-base text-custom-text-300 !leading-3">{attachmentCount}</p>
      </span>
    ),
    [attachmentCount]
  );

  return (
    <CollapsibleButton
      isOpen={isOpen}
      title={t("attachments")}
      indicatorElement={indicatorElement}
      actionItemElement={
        !disabled && (
          <IssueAttachmentActionButton
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
            disabled={disabled}
          />
        )
      }
    />
  );
});
