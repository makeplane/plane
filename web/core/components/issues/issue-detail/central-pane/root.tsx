import React, { FC } from "react";
import { observer } from "mobx-react";
// components
import {
  SubIssuesHeader,
  SubIssuesAccordion,
  RelationsHeader,
  AttachmentsHeader,
  LinksHeader,
} from "@/components/issues/issue-detail/central-pane";
// hooks
import { useIssueDetail } from "@/hooks/store";
import { RelationsAccordion } from "./relations/accordion";

type TCentralPane = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const CentralPane: FC<TCentralPane> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled } = props;

  // store hooks
  const {
    subIssues: { subIssuesByIssueId },
  } = useIssueDetail();

  // derived values
  const subIssues = subIssuesByIssueId(issueId);

  const shouldRenderSubIssues = subIssues && subIssues.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <SubIssuesHeader workspaceSlug={workspaceSlug} projectId={projectId} parentIssueId={issueId} />
        <RelationsHeader workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} disabled={disabled} />
        <LinksHeader />
        <AttachmentsHeader />
      </div>
      <div className="flex flex-col">
        {shouldRenderSubIssues && (
          <SubIssuesAccordion
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            parentIssueId={issueId}
            disabled={disabled}
          />
        )}
        <RelationsAccordion workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} disabled={disabled} />
      </div>
    </div>
  );
});
