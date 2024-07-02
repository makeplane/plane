"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { RelationsIcon } from "@plane/ui";
// components
import { CentralPaneHeaderActionButton, RelationActionButton } from "@/components/issues/issue-detail/central-pane";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
};

export const RelationsHeader: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled = false } = props;

  return (
    <RelationActionButton
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      issueId={issueId}
      disabled={disabled}
      customButton={
        <CentralPaneHeaderActionButton
          title="Add Relation"
          icon={<RelationsIcon className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-300" />}
        />
      }
    />
  );
});
