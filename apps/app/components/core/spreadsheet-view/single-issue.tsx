import React, { useCallback, useState } from "react";

import { useRouter } from "next/router";
import { mutate } from "swr";

// components
import {
  ViewAssigneeSelect,
  ViewDueDateSelect,
  ViewEstimateSelect,
  ViewPrioritySelect,
  ViewStateSelect,
} from "components/issues";
import { Icon } from "components/ui";
// icons
import { LinkIcon, PaperClipIcon } from "@heroicons/react/24/outline";
// hooks
import useSpreadsheetIssuesView from "hooks/use-spreadsheet-issues-view";
// services
import issuesService from "services/issues.service";
// constant
import {
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_ISSUES_WITH_PARAMS,
  PROJECT_ISSUES_LIST_WITH_PARAMS,
  VIEW_ISSUES,
} from "constants/fetch-keys";
// types
import { ICurrentUserResponse, IIssue, Properties, UserAuth } from "types";
// helper
import { truncateText } from "helpers/string.helper";

type Props = {
  issue: IIssue;
  expanded: boolean;
  handleToggleExpand: (issueId: string) => void;
  properties: Properties;
  gridTemplateColumns: string;
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
  nestingLevel: number;
};

export const SingleSpreadsheetIssue: React.FC<Props> = ({
  issue,
  expanded,
  handleToggleExpand,
  properties,
  gridTemplateColumns,
  user,
  userAuth,
  nestingLevel,
}) => {
  const router = useRouter();

  const { workspaceSlug, projectId, cycleId, moduleId, viewId } = router.query;

  const { params } = useSpreadsheetIssuesView();

  const partialUpdateIssue = useCallback(
    (formData: Partial<IIssue>, issueId: string) => {
      if (!workspaceSlug || !projectId) return;

      const fetchKey = cycleId
        ? CYCLE_ISSUES_WITH_PARAMS(cycleId.toString(), params)
        : moduleId
        ? MODULE_ISSUES_WITH_PARAMS(moduleId.toString(), params)
        : viewId
        ? VIEW_ISSUES(viewId.toString(), params)
        : PROJECT_ISSUES_LIST_WITH_PARAMS(projectId.toString(), params);

      mutate<IIssue[]>(
        fetchKey,
        (prevData) =>
          (prevData ?? []).map((p) => {
            if (p.id === issueId) {
              return {
                ...p,
                ...formData,
              };
            }
            return p;
          }),
        false
      );

      issuesService
        .patchIssue(workspaceSlug as string, projectId as string, issueId as string, formData, user)
        .then(() => {
          mutate(fetchKey);
        })
        .catch((error) => {
          console.log(error);
        });
    },
    [workspaceSlug, projectId, cycleId, moduleId, viewId, params, user]
  );

  const paddingLeft = `${(nestingLevel - 1) * 48}px`;

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  return (
    <div
      className="group grid auto-rows-[minmax(44px,1fr)] px-2 hover:rounded-sm hover:bg-brand-surface-2 border-b border-brand-base w-full min-w-max"
      style={{ gridTemplateColumns }}
    >
      {properties.key ? (
        issue.parent ? (
          <span className="p-1" />
        ) : (
          <div className="flex  items-center cursor-pointer text-xs text-brand-secondary text-center p-2 border-brand-base">
            {issue.project_detail?.identifier}-{issue.sequence_id}
          </div>
        )
      ) : (
        ""
      )}
      <div className="flex gap-1 items-center">
        {properties.key && issue.parent && (
          <div
            className="flex  items-center cursor-pointer text-xs text-brand-secondary text-center p-2 border-brand-base"
            style={{ paddingLeft }}
          >
            {issue.project_detail?.identifier}-{issue.sequence_id}
          </div>
        )}

        <div className="h-5 w-5">
          {issue.sub_issues_count > 0 && (
            <button
              className="h-5 w-5 hover:bg-brand-surface-1 hover:text-brand-base rounded-sm"
              onClick={() => handleToggleExpand(issue.id)}
            >
              <Icon iconName="chevron_right" className={`${expanded ? "rotate-90" : ""}`} />
            </button>
          )}
        </div>

        <span className=" text-[0.825rem]">{truncateText(issue.name, 45)}</span>
      </div>
      {properties.state && (
        <div className="flex items-center text-xs text-brand-secondary text-center p-2 hover:rounded-md hover:shadow-sm hover:border group-hover:bg-brand-surface-2 border-brand-base">
          <ViewStateSelect
            issue={issue}
            partialUpdateIssue={partialUpdateIssue}
            position="right"
            customButton
            user={user}
            isNotAllowed={isNotAllowed}
          />
        </div>
      )}
      {properties.due_date && (
        <div className="flex items-center text-xs text-brand-secondary text-center p-2 hover:rounded-md hover:shadow-sm hover:border group-hover:bg-brand-surface-2 border-brand-base">
          <ViewDueDateSelect
            issue={issue}
            partialUpdateIssue={partialUpdateIssue}
            noBorder
            user={user}
            isNotAllowed={isNotAllowed}
          />
        </div>
      )}
      {properties.priority && (
        <div className="flex items-center justify-center text-xs text-brand-secondary text-center p-2 hover:rounded-md hover:shadow-sm hover:border group-hover:bg-brand-surface-2 border-brand-base">
          <ViewPrioritySelect
            issue={issue}
            partialUpdateIssue={partialUpdateIssue}
            position="right"
            noBorder
            user={user}
            isNotAllowed={isNotAllowed}
          />
        </div>
      )}
      {properties.labels ? (
        issue.label_details.length > 0 ? (
          <div className="flex items-center justify-center gap-2 text-xs text-brand-secondary text-center p-2 hover:rounded-md hover:shadow-sm hover:border group-hover:bg-brand-surface-2 border-brand-base">
            {issue.label_details.slice(0, 4).map((label, index) => (
              <div className={`flex h-4 w-4 rounded-full ${index ? "-ml-3.5" : ""}`}>
                <span
                  className={`h-4 w-4 flex-shrink-0 rounded-full border hover:rounded-md hover:shadow-sm hover:border group-hover:bg-brand-surface-2 border-brand-base
                `}
                  style={{
                    backgroundColor: label?.color && label.color !== "" ? label.color : "#000000",
                  }}
                />
              </div>
            ))}
            {issue.label_details.length > 4 ? <span>+{issue.label_details.length - 4}</span> : null}
          </div>
        ) : (
          <div className="flex items-center justify-center text-xs text-brand-secondary text-center p-2 hover:rounded-md hover:shadow-sm hover:border group-hover:bg-brand-surface-2 border-brand-base">
            No Labels
          </div>
        )
      ) : (
        ""
      )}
      {properties.assignee && (
        <div className="flex items-center justify-center text-xs text-brand-secondary text-center p-2 hover:rounded-md hover:shadow-sm hover:border group-hover:bg-brand-surface-2 border-brand-base">
          <ViewAssigneeSelect
            issue={issue}
            partialUpdateIssue={partialUpdateIssue}
            position="right"
            customButton
            user={user}
            isNotAllowed={isNotAllowed}
          />
        </div>
      )}
      {properties.estimate && (
        <div className="flex items-center justify-center text-xs text-brand-secondary text-center p-2 hover:rounded-md hover:shadow-sm hover:border group-hover:bg-brand-surface-2 border-brand-base">
          <ViewEstimateSelect
            issue={issue}
            partialUpdateIssue={partialUpdateIssue}
            position="right"
            user={user}
            isNotAllowed={isNotAllowed}
          />
        </div>
      )}
      {properties.link && (
        <div className="flex items-center justify-center text-xs text-brand-secondary text-center p-2 hover:rounded-md hover:shadow-sm hover:border group-hover:bg-brand-surface-2 border-brand-base">
          <div className="flex cursor-default items-center px-2.5 py-1 text-xs">
            <div className="flex items-center gap-1 text-brand-secondary">
              <LinkIcon className="h-3.5 w-3.5" />
              {issue.link_count}
            </div>
          </div>
        </div>
      )}
      {properties.attachment_count && (
        <div className="flex items-center justify-center text-xs text-brand-secondary text-center p-2 hover:rounded-md hover:shadow-sm hover:border group-hover:bg-brand-surface-2 border-brand-base">
          <div className="flex cursor-default items-center px-2.5 py-1 text-xs">
            <div className="flex items-center gap-1 text-brand-secondary">
              <PaperClipIcon className="h-3.5 w-3.5 -rotate-45" />
              {issue.attachment_count}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
