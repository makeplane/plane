"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { RelationsIcon } from "@plane/ui";
// components
import { CentralPaneHeaderActionButton, RelationActionButton } from "@/components/issues/issue-detail/central-pane";
// hooks
import { useIssueDetail } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
};

export const RelationsHeader: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled = false } = props;
  // store hooks
  const {
    relation: { getRelationsByIssueId },
  } = useIssueDetail();

  // derived values
  const issueRelations = getRelationsByIssueId(issueId);

  // button render conditions
  const relationsCount = Object.values(issueRelations ?? {}).reduce((acc, relation) => acc + relation.length, 0);

  return (
    <RelationActionButton
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      issueId={issueId}
      disabled={disabled}
      customButton={
        <CentralPaneHeaderActionButton
          title={relationsCount && relationsCount > 0 ? `${relationsCount}` : "Relations"}
          icon={<RelationsIcon className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-300" />}
        />
      }
    />
  );
});
