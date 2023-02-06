import React, { useCallback } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import stateService from "services/state.service";
import issuesService from "services/issues.service";
// components
import { DueDateSelect, PrioritySelect, StateSelect } from "components/core/select";
// ui
import { AssigneesList } from "components/ui/avatar";
import { CustomMenu } from "components/ui";
// types
import { IIssue, Properties } from "types";
// fetch-keys
import { STATE_LIST, USER_ISSUE } from "constants/fetch-keys";

type Props = {
  issue: IIssue;
  properties: Properties;
  projectId: string;
  handleDeleteIssue: () => void;
};

export const MyIssuesListItem: React.FC<Props> = ({
  issue,
  properties,
  projectId,
  handleDeleteIssue,
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: states } = useSWR(
    workspaceSlug && projectId ? STATE_LIST(projectId) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId)
      : null
  );

  const partialUpdateIssue = useCallback(
    (formData: Partial<IIssue>) => {
      if (!workspaceSlug) return;

      mutate<IIssue[]>(
        USER_ISSUE(workspaceSlug as string),
        (prevData) =>
          prevData?.map((p) => {
            if (p.id === issue.id) return { ...p, ...formData };

            return p;
          }),
        false
      );

      issuesService
        .patchIssue(workspaceSlug as string, projectId as string, issue.id, formData)
        .then((res) => {
          mutate(USER_ISSUE(workspaceSlug as string));
        })
        .catch((error) => {
          console.log(error);
        });
    },
    [workspaceSlug, projectId, issue]
  );

  const isNotAllowed = false;

  return (
    <div key={issue.id} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
      <div className="flex items-center gap-2">
        <span
          className={`block h-1.5 w-1.5 flex-shrink-0 rounded-full`}
          style={{
            backgroundColor: issue.state_detail.color,
          }}
        />
        <Link href={`/${workspaceSlug}/projects/${issue?.project_detail?.id}/issues/${issue.id}`}>
          <a className="group relative flex items-center gap-2">
            {properties?.key && (
              <span className="flex-shrink-0 text-xs text-gray-500">
                {issue.project_detail?.identifier}-{issue.sequence_id}
              </span>
            )}
            <span>{issue.name}</span>
          </a>
        </Link>
      </div>
      <div className="flex flex-shrink-0 flex-wrap items-center gap-x-1 gap-y-2 text-xs">
        {properties.priority && (
          <PrioritySelect
            issue={issue}
            partialUpdateIssue={partialUpdateIssue}
            isNotAllowed={isNotAllowed}
          />
        )}
        {properties.state && (
          <StateSelect
            issue={issue}
            states={states}
            partialUpdateIssue={partialUpdateIssue}
            isNotAllowed={isNotAllowed}
          />
        )}
        {properties.due_date && (
          <DueDateSelect
            issue={issue}
            partialUpdateIssue={partialUpdateIssue}
            isNotAllowed={isNotAllowed}
          />
        )}
        {properties.sub_issue_count && (
          <div className="flex flex-shrink-0 items-center gap-1 rounded border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            {issue?.sub_issues_count} {issue?.sub_issues_count === 1 ? "sub-issue" : "sub-issues"}
          </div>
        )}
        {properties.assignee && (
          <div className="flex items-center gap-1">
            <AssigneesList userIds={issue.assignees ?? []} />
          </div>
        )}
        <CustomMenu width="auto" ellipsis>
          <CustomMenu.MenuItem onClick={handleDeleteIssue}>Delete permanently</CustomMenu.MenuItem>
        </CustomMenu>
      </div>
    </div>
  );
};
