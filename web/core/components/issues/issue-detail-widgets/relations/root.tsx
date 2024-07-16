"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { Collapsible } from "@plane/ui";
// components
import { RelationsCollapsibleContent, RelationsCollapsibleTitle } from "@/components/issues/issue-detail-widgets";
// hooks
import { useIssueDetail } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
};

export const RelationsCollapsible: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled = false } = props;
  // store hooks
  const { openWidgets, toggleOpenWidget } = useIssueDetail();

  // derived values
  const isCollapsibleOpen = openWidgets.includes("relations");

  return (
    <Collapsible
      isOpen={isCollapsibleOpen}
      onToggle={() => toggleOpenWidget("relations")}
      title={<RelationsCollapsibleTitle isOpen={isCollapsibleOpen} issueId={issueId} disabled={disabled} />}
      buttonClassName="w-full"
    >
      <RelationsCollapsibleContent
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        disabled={disabled}
      />
    </Collapsible>
  );
});
