import React, { FC } from "react";
import { observer } from "mobx-react";
// components
import { AccordionButton, RelationActionButton } from "@/components/issues/issue-detail/central-pane";
import { useIssueDetail } from "@/hooks/store";

type Props = {
  isOpen: boolean;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const RelationsAccordionTitle: FC<Props> = observer((props) => {
  const { isOpen, workspaceSlug, projectId, issueId, disabled } = props;
  // store hook
  const {
    relation: { getRelationsByIssueId },
  } = useIssueDetail();
  // derived values
  const issueRelations = getRelationsByIssueId(issueId);
  const relationsCount = Object.values(issueRelations ?? {}).reduce((acc, curr) => acc + curr.length, 0);

  const indicatorElement = (
    <span className="flex items-center justify-center ">
      <p className="text-base text-custom-text-300 !leading-3">{relationsCount}</p>
    </span>
  );

  return (
    <AccordionButton
      isOpen={isOpen}
      title="Relations"
      indicatorElement={indicatorElement}
      actionItemElement={
        <RelationActionButton
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          disabled={disabled}
        />
      }
    />
  );
});
