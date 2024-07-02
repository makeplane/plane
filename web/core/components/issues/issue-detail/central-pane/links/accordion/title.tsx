import React, { FC } from "react";
import { observer } from "mobx-react";
// components
import { AccordionButton, IssueLinksActionButton } from "@/components/issues/issue-detail/central-pane";
import { useIssueDetail } from "@/hooks/store";

type Props = {
  isOpen: boolean;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const IssueLinksAccordionTitle: FC<Props> = observer((props) => {
  const { isOpen, workspaceSlug, projectId, issueId, disabled } = props;

  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  const issue = getIssueById(issueId);

  const linksCount = issue?.link_count ?? 0;

  const indicatorElement = (
    <span className="flex items-center justify-center ">
      <p className="text-base text-custom-text-300 !leading-3">{linksCount}</p>
    </span>
  );

  return (
    <AccordionButton
      isOpen={isOpen}
      title="Links"
      indicatorElement={indicatorElement}
      actionItemElement={
        <IssueLinksActionButton
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          disabled={disabled}
        />
      }
    />
  );
});
