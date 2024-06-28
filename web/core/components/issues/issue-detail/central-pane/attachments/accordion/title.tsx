import React, { FC } from "react";
import { observer } from "mobx-react";
// components
import { AccordionButton, IssueAttachmentActionButton } from "@/components/issues/issue-detail/central-pane";

type Props = {
  isOpen: boolean;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const IssueAttachmentsAccordionTitle: FC<Props> = observer((props) => {
  const { isOpen, workspaceSlug, projectId, issueId, disabled } = props;

  return (
    <AccordionButton
      isOpen={isOpen}
      title="Attachments"
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
