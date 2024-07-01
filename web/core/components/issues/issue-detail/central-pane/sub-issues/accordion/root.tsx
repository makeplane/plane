import React, { FC, useState } from "react";
import { Accordion } from "@plane/ui";
// components
import { SubIssuesAccordionContent, SubIssuesAccordionTitle } from "@/components/issues/issue-detail/central-pane";

type TSubIssuesAccordionProps = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
};

export const SubIssuesAccordion: FC<TSubIssuesAccordionProps> = (props) => {
  const { workspaceSlug, projectId, issueId, disabled = false } = props;
  // state
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <Accordion
      isOpen={isOpen}
      handleToggle={() => setIsOpen((prev) => !prev)}
      title={
        <SubIssuesAccordionTitle
          isOpen={isOpen}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          parentIssueId={issueId}
          disabled={disabled}
        />
      }
    >
      <SubIssuesAccordionContent
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        parentIssueId={issueId}
        disabled={disabled}
      />
    </Accordion>
  );
};
