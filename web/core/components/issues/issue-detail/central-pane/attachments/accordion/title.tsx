import React, { FC } from "react";
import { observer } from "mobx-react";
// components
import { AccordionButton, IssueAttachmentActionButton } from "@/components/issues/issue-detail/central-pane";
// hooks
import { useIssueDetail } from "@/hooks/store";

type Props = {
  isOpen: boolean;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const IssueAttachmentsAccordionTitle: FC<Props> = observer((props) => {
  const { isOpen, workspaceSlug, projectId, issueId, disabled } = props;

  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  const issue = getIssueById(issueId);
  const attachmentCount = issue?.attachment_count ?? 0;

  const indicatorElement = (
    <span className="flex items-center justify-center ">
      <p className="text-base text-custom-text-300 !leading-3">{attachmentCount}</p>
    </span>
  );

  return (
    <AccordionButton
      isOpen={isOpen}
      title="Attachments"
      indicatorElement={indicatorElement}
      actionItemElement={
        <IssueAttachmentActionButton
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          disabled={disabled}
        />
      }
    />
  );
});
