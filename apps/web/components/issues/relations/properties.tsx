/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TIssuePriorities, TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// components
import { MemberSelect } from "@/components/dropdowns/member/member-select";
import { PrioritySelect } from "@/components/dropdowns/priority/priority-select";
import { StateSelect } from "@/components/dropdowns/state/state-select";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// types
import type { TRelationIssueOperations } from "../issue-detail-widgets/relations/helper";

type Props = {
  workspaceSlug: string;
  issueId: string;
  disabled: boolean;
  issueOperations: TRelationIssueOperations;
  issueServiceType?: TIssueServiceType;
};

export const RelationIssueProperty = observer(function RelationIssueProperty(props: Props) {
  const { workspaceSlug, issueId, disabled, issueOperations, issueServiceType = EIssueServiceType.ISSUES } = props;
  // hooks
  const { t } = useTranslation();
  const {
    issue: { getIssueById },
  } = useIssueDetail(issueServiceType);

  // derived value
  const issue = getIssueById(issueId);

  // if issue is not found, return empty
  if (!issue) return <></>;

  // handlers
  const handleStateChange = (val: string) =>
    issue.project_id &&
    issueOperations.update(workspaceSlug, issue.project_id, issueId, {
      state_id: val,
    });

  const handlePriorityChange = (val: TIssuePriorities) =>
    issue.project_id &&
    issueOperations.update(workspaceSlug, issue.project_id, issueId, {
      priority: val,
    });

  const handleAssigneeChange = (val: string[]) =>
    issue.project_id &&
    issueOperations.update(workspaceSlug, issue.project_id, issueId, {
      assignee_ids: val,
    });

  return (
    <div className="relative flex items-center gap-2">
      <StateSelect
        value={issue.state_id}
        projectId={issue.project_id ?? undefined}
        onChange={handleStateChange}
        disabled={disabled}
        variant="pill-sm"
        tooltip
      />

      <PrioritySelect
        value={issue.priority}
        onChange={handlePriorityChange}
        disabled={disabled}
        variant="pill-sm"
        tooltip
      />

      <MemberSelect
        value={issue.assignee_ids ?? []}
        projectId={issue.project_id ?? undefined}
        onChange={handleAssigneeChange}
        disabled={disabled}
        multiple
        variant={issue.assignee_ids?.length ? "avatar-group-sm" : "pill-sm"}
        tooltip={{ heading: t("common.assignees") }}
      />
    </div>
  );
});
