import React, { FC, useState } from "react";
import { Accordion } from "@plane/ui";
// components
import { IssueLinksAccordionContent, IssueLinksAccordionTitle } from "@/components/issues/issue-detail/central-pane";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
};

export const LinksAccordion: FC<Props> = (props) => {
  const { workspaceSlug, projectId, issueId, disabled = false } = props;
  // state
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <Accordion
      isOpen={isOpen}
      handleToggle={() => setIsOpen((prev) => !prev)}
      title={
        <IssueLinksAccordionTitle
          isOpen={isOpen}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          disabled={disabled}
        />
      }
    >
      <IssueLinksAccordionContent
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        disabled={disabled}
      />
    </Accordion>
  );
};
