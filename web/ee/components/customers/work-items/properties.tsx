"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
// components
import { TIssuePriorities, TIssueServiceType } from "@plane/types";
import { PriorityDropdown, MemberDropdown, StateDropdown } from "@/components/dropdowns";
// hooks
import { useIssueDetail } from "@/hooks/store";
// types
import { TCustomerWorkItemOperations } from "./helper";

type Props = {
  workspaceSlug: string;
  workItemId: string;
  disabled: boolean;
  workItemOperations: TCustomerWorkItemOperations;
  issueServiceType?: TIssueServiceType;
};

export const CustomerWorkItemProperties: FC<Props> = observer((props) => {
  const {
    workspaceSlug,
    workItemId,
    disabled,
    workItemOperations,
    issueServiceType = EIssueServiceType.ISSUES,
  } = props;
  // hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail(issueServiceType);

  // derived value
  const workItem = getIssueById(workItemId);

  // if issue is not found, return empty
  if (!workItem) return <></>;

  // handlers
  const handleStateChange = (val: string) =>
    workItem.project_id &&
    workItemOperations.update(workspaceSlug, workItem.project_id, workItemId, {
      state_id: val,
    });

  const handlePriorityChange = (val: TIssuePriorities) =>
    workItem.project_id &&
    workItemOperations.update(workspaceSlug, workItem.project_id, workItemId, {
      priority: val,
    });

  const handleAssigneeChange = (val: string[]) =>
    workItem.project_id &&
    workItemOperations.update(workspaceSlug, workItem.project_id, workItemId, {
      assignee_ids: val,
    });

  return (
    <div className="relative flex items-center gap-2">
      <div className="h-5 flex-shrink-0">
        <StateDropdown
          value={workItem.state_id}
          projectId={workItem.project_id ?? undefined}
          onChange={handleStateChange}
          disabled={disabled}
          buttonVariant="border-with-text"
        />
      </div>

      <div className="h-5 flex-shrink-0">
        <PriorityDropdown
          value={workItem.priority}
          onChange={handlePriorityChange}
          disabled={disabled}
          buttonVariant="border-without-text"
          buttonClassName="border"
        />
      </div>

      <div className="h-5 flex-shrink-0">
        <MemberDropdown
          value={workItem.assignee_ids}
          projectId={workItem.project_id ?? undefined}
          onChange={handleAssigneeChange}
          disabled={disabled}
          multiple
          buttonVariant={(workItem?.assignee_ids || []).length > 0 ? "transparent-without-text" : "border-without-text"}
          buttonClassName={(workItem?.assignee_ids || []).length > 0 ? "hover:bg-transparent px-0" : ""}
        />
      </div>
    </div>
  );
});
