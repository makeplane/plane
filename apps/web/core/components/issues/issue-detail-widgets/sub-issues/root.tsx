/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// plane imports
import type { TIssueServiceType } from "@plane/types";
import { Collapsible } from "@plane/ui";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import { SubIssuesCollapsibleContent } from "./content";
import { SubWorkItemTitleActions } from "./title-actions";
import { SubIssuesCollapsibleTitle } from "./title";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const SubIssuesCollapsible = observer(function SubIssuesCollapsible(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled = false, issueServiceType } = props;
  // store hooks
  const {
    openWidgets,
    toggleOpenWidget,
    subIssues: { subIssuesByIssueId },
  } = useIssueDetail(issueServiceType);
  // derived values
  const isCollapsibleOpen = openWidgets.includes("sub-work-items");
  // the title renders nothing until the sub-issues are loaded; keep the action in step with it
  const hasSubIssues = !!subIssuesByIssueId(issueId);

  return (
    <Collapsible
      isOpen={isCollapsibleOpen}
      onToggle={() => toggleOpenWidget("sub-work-items")}
      title={<SubIssuesCollapsibleTitle isOpen={isCollapsibleOpen} parentIssueId={issueId} />}
      actionElement={
        hasSubIssues && (
          <SubWorkItemTitleActions
            projectId={projectId}
            parentId={issueId}
            disabled={disabled}
            issueServiceType={issueServiceType}
          />
        )
      }
      buttonClassName="w-full"
    >
      <SubIssuesCollapsibleContent
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        parentIssueId={issueId}
        disabled={disabled}
        issueServiceType={issueServiceType}
      />
    </Collapsible>
  );
});
