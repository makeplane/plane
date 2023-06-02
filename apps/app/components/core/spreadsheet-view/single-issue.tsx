import React, { useCallback } from "react";

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
import { IIssue, Properties, UserAuth } from "types";
// helper
import { truncateText } from "helpers/string.helper";

type Props = {
  issue: IIssue;
  properties: Properties;
  gridTemplateColumns: string;
  userAuth: UserAuth;
};

export const SingleSpreadsheetIssue: React.FC<Props> = ({
  issue,
  properties,
  gridTemplateColumns,
  userAuth,
}) => {
  const router = useRouter();

  const { workspaceSlug, projectId, cycleId, moduleId, viewId } = router.query;

  // const { groupByProperty: selectedGroup, orderBy, params } = useIssuesView();
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
        .patchIssue(workspaceSlug as string, projectId as string, issueId as string, formData)
        .then(() => {
          mutate(fetchKey);
        })
        .catch((error) => {
          console.log(error);
        });
    },
    [workspaceSlug, projectId, cycleId, moduleId, viewId, params]
  );

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  return (
    <div
      className="grid auto-rows-[minmax(36px,1fr)] rounded-lg hover:bg-brand-surface-2"
      style={{ gridTemplateColumns }}
    >
      {properties.key && (
        <div className="flex  items-center text-xs text-brand-secondary text-center p-2 border-b border-brand-base">
          {issue.project_detail?.identifier}-{issue.sequence_id}
        </div>
      )}
      <div className="flex items-center text-[0.825rem] text-brand-secondary p-2 border-b border-brand-base">
        {truncateText(issue.name, 30)}
      </div>
      {properties.priority && (
        <div className="flex items-center justify-center text-xs text-brand-secondary text-center p-2 border-b border-brand-base">
          <ViewPrioritySelect
            issue={issue}
            partialUpdateIssue={partialUpdateIssue}
            position="right"
            isNotAllowed={isNotAllowed}
          />
        </div>
      )}
      {properties.state && (
        <div className="flex items-center text-xs text-brand-secondary text-center p-2 border-b border-brand-base">
          <ViewStateSelect
            issue={issue}
            partialUpdateIssue={partialUpdateIssue}
            position="right"
            isNotAllowed={isNotAllowed}
          />
        </div>
      )}
      {properties.due_date && (
        <div className="flex items-center text-xs text-brand-secondary text-center p-2 border-b border-brand-base">
          <ViewDueDateSelect
            issue={issue}
            partialUpdateIssue={partialUpdateIssue}
            isNotAllowed={isNotAllowed}
          />
        </div>
      )}
      {properties.labels ? (
        issue.label_details.length > 0 ? (
          <div className="flex items-center text-xs text-brand-secondary text-center p-2 border-b border-brand-base">
            <div className="flex flex-wrap gap-1">
              {issue.label_details.map((label) => (
                <span
                  key={label.id}
                  className="group flex items-center gap-1 rounded-2xl border border-brand-base px-2 py-0.5 text-xs text-brand-secondary"
                >
                  <span
                    className="h-1.5 w-1.5  rounded-full"
                    style={{
                      backgroundColor: label?.color && label.color !== "" ? label.color : "#000",
                    }}
                  />
                  {label.name}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center text-xs text-brand-secondary text-center p-2 border-b border-brand-base">
            No Labels
          </div>
        )
      ) : (
        ""
      )}
      {properties.assignee && (
        <div className="flex items-center justify-center text-xs text-brand-secondary text-center p-2 border-b border-brand-base">
          <ViewAssigneeSelect
            issue={issue}
            partialUpdateIssue={partialUpdateIssue}
            position="right"
            isNotAllowed={isNotAllowed}
          />
        </div>
      )}
      {properties.estimate && (
        <div className="flex items-center justify-center text-xs text-brand-secondary text-center p-2 border-b border-brand-base">
          <ViewEstimateSelect
            issue={issue}
            partialUpdateIssue={partialUpdateIssue}
            position="right"
            isNotAllowed={isNotAllowed}
          />
        </div>
      )}

      {properties.link && (
        <div className="flex items-center justify-center text-xs text-brand-secondary text-center p-2 border-b border-brand-base">
          <div className="flex cursor-default items-center rounded-md border border-brand-base px-2.5 py-1 text-xs shadow-sm">
            <div className="flex items-center gap-1 text-brand-secondary">
              <LinkIcon className="h-3.5 w-3.5" />
              {issue.link_count}
            </div>
          </div>
        </div>
      )}
      {properties.attachment_count && (
        <div className="flex items-center justify-center text-xs text-brand-secondary text-center p-2 border-b border-brand-base">
          <div className="flex cursor-default items-center rounded-md border border-brand-base px-2.5 py-1 text-xs shadow-sm">
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
