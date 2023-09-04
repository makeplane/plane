import React, { useCallback, useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// components
import {
  ViewAssigneeSelect,
  ViewDueDateSelect,
  ViewEstimateSelect,
  ViewIssueLabel,
  ViewPrioritySelect,
  ViewStartDateSelect,
  ViewStateSelect,
} from "components/issues";
import { Popover2 } from "@blueprintjs/popover2";
// icons
import { Icon } from "components/ui";
import {
  EllipsisHorizontalIcon,
  LinkIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
// hooks
import useSpreadsheetIssuesView from "hooks/use-spreadsheet-issues-view";
import useToast from "hooks/use-toast";
// services
import issuesService from "services/issues.service";
// constant
import {
  CYCLE_DETAILS,
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_DETAILS,
  MODULE_ISSUES_WITH_PARAMS,
  PROJECT_ISSUES_LIST_WITH_PARAMS,
  SUB_ISSUES,
  VIEW_ISSUES,
} from "constants/fetch-keys";
// types
import { ICurrentUserResponse, IIssue, ISubIssueResponse, Properties, UserAuth } from "types";
// helper
import { copyTextToClipboard } from "helpers/string.helper";
import { renderLongDetailDateFormat } from "helpers/date-time.helper";

type Props = {
  issue: IIssue;
  index: number;
  expanded: boolean;
  handleToggleExpand: (issueId: string) => void;
  properties: Properties;
  handleEditIssue: (issue: IIssue) => void;
  handleDeleteIssue: (issue: IIssue) => void;
  gridTemplateColumns: string;
  disableUserActions: boolean;
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
  nestingLevel: number;
};

export const SingleSpreadsheetIssue: React.FC<Props> = ({
  issue,
  index,
  expanded,
  handleToggleExpand,
  properties,
  handleEditIssue,
  handleDeleteIssue,
  gridTemplateColumns,
  disableUserActions,
  user,
  userAuth,
  nestingLevel,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const router = useRouter();

  const { workspaceSlug, projectId, cycleId, moduleId, viewId } = router.query;

  const { params } = useSpreadsheetIssuesView();

  const { setToastAlert } = useToast();

  const partialUpdateIssue = useCallback(
    (formData: Partial<IIssue>, issue: IIssue) => {
      if (!workspaceSlug || !projectId) return;

      const fetchKey = cycleId
        ? CYCLE_ISSUES_WITH_PARAMS(cycleId.toString(), params)
        : moduleId
        ? MODULE_ISSUES_WITH_PARAMS(moduleId.toString(), params)
        : viewId
        ? VIEW_ISSUES(viewId.toString(), params)
        : PROJECT_ISSUES_LIST_WITH_PARAMS(projectId.toString(), params);

      if (issue.parent)
        mutate<ISubIssueResponse>(
          SUB_ISSUES(issue.parent.toString()),
          (prevData) => {
            if (!prevData) return prevData;

            return {
              ...prevData,
              sub_issues: (prevData.sub_issues ?? []).map((i) => {
                if (i.id === issue.id) {
                  return {
                    ...i,
                    ...formData,
                  };
                }
                return i;
              }),
            };
          },
          false
        );
      else
        mutate<IIssue[]>(
          fetchKey,
          (prevData) =>
            (prevData ?? []).map((p) => {
              if (p.id === issue.id) {
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
        .patchIssue(
          workspaceSlug as string,
          projectId as string,
          issue.id as string,
          formData,
          user
        )
        .then(() => {
          if (issue.parent) {
            mutate(SUB_ISSUES(issue.parent as string));
          } else {
            mutate(fetchKey);

            if (cycleId) mutate(CYCLE_DETAILS(cycleId as string));
            if (moduleId) mutate(MODULE_DETAILS(moduleId as string));
          }
        })
        .catch((error) => {
          console.log(error);
        });
    },
    [workspaceSlug, projectId, cycleId, moduleId, viewId, params, user]
  );

  const openPeekOverview = () => {
    const { query } = router;

    router.push({
      pathname: router.pathname,
      query: { ...query, peekIssue: issue.id },
    });
  };

  const handleCopyText = () => {
    const originURL =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    copyTextToClipboard(
      `${originURL}/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`
    ).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Issue link copied to clipboard.",
      });
    });
  };

  const paddingLeft = `${nestingLevel * 68}px`;

  const tooltipPosition = index === 0 ? "bottom" : "top";

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  return (
    <>
      <div
        className="relative group grid auto-rows-[minmax(44px,1fr)] hover:rounded-sm hover:bg-custom-background-80 border-b border-custom-border-200 w-full min-w-max"
        style={{ gridTemplateColumns }}
      >
        <div className="flex gap-1.5 items-center px-4 sticky z-[1] left-0 text-custom-text-200 bg-custom-background-100 group-hover:text-custom-text-100 group-hover:bg-custom-background-80 border-custom-border-200 w-full">
          <div className="flex gap-1.5 items-center" style={issue.parent ? { paddingLeft } : {}}>
            <div className="relative flex items-center cursor-pointer text-xs text-center hover:text-custom-text-100 w-14">
              {properties.key && (
                <span className="flex items-center justify-center opacity-100 group-hover:opacity-0">
                  {issue.project_detail?.identifier}-{issue.sequence_id}
                </span>
              )}
              {!isNotAllowed && !disableUserActions && (
                <div className="absolute top-0 left-2.5 opacity-0 group-hover:opacity-100">
                  <Popover2
                    isOpen={isOpen}
                    canEscapeKeyClose
                    onInteraction={(nextOpenState) => setIsOpen(nextOpenState)}
                    content={
                      <div
                        className={`flex flex-col gap-1.5 overflow-y-scroll whitespace-nowrap rounded-md border p-1 text-xs shadow-lg focus:outline-none max-h-44 min-w-full border-custom-border-200 bg-custom-background-90`}
                      >
                        <button
                          type="button"
                          className="hover:text-custom-text-200 w-full select-none gap-2 truncate rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80"
                          onClick={() => {
                            handleEditIssue(issue);
                            setIsOpen(false);
                          }}
                        >
                          <div className="flex items-center justify-start gap-2">
                            <PencilIcon className="h-4 w-4" />
                            <span>Edit issue</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          className="hover:text-custom-text-200 w-full select-none gap-2 truncate rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80"
                          onClick={() => {
                            handleDeleteIssue(issue);
                            setIsOpen(false);
                          }}
                        >
                          <div className="flex items-center justify-start gap-2">
                            <TrashIcon className="h-4 w-4" />
                            <span>Delete issue</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          className="hover:text-custom-text-200 w-full select-none gap-2 truncate rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80"
                          onClick={() => {
                            handleCopyText();
                            setIsOpen(false);
                          }}
                        >
                          <div className="flex items-center justify-start gap-2">
                            <LinkIcon className="h-4 w-4" />
                            <span>Copy issue link</span>
                          </div>
                        </button>
                      </div>
                    }
                    placement="bottom-start"
                  >
                    <EllipsisHorizontalIcon className="h-5 w-5 text-custom-text-200" />
                  </Popover2>
                </div>
              )}
            </div>

            {issue.sub_issues_count > 0 && (
              <div className="h-6 w-6 flex justify-center items-center">
                <button
                  className="h-5 w-5 hover:bg-custom-background-90 hover:text-custom-text-100 rounded-sm cursor-pointer"
                  onClick={() => handleToggleExpand(issue.id)}
                >
                  <Icon iconName="chevron_right" className={`${expanded ? "rotate-90" : ""}`} />
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="truncate text-custom-text-100 text-left cursor-pointer w-full text-[0.825rem]"
            onClick={openPeekOverview}
          >
            {issue.name}
          </button>
        </div>
        {properties.state && (
          <div className="flex items-center text-xs text-custom-text-200 text-center p-2 group-hover:bg-custom-background-80 border-custom-border-200">
            <ViewStateSelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              position="left"
              className="max-w-full"
              tooltipPosition={tooltipPosition}
              customButton
              user={user}
              isNotAllowed={isNotAllowed}
            />
          </div>
        )}
        {properties.priority && (
          <div className="flex items-center text-xs text-custom-text-200 text-center p-2 group-hover:bg-custom-background-80 border-custom-border-200">
            <ViewPrioritySelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              position="left"
              tooltipPosition={tooltipPosition}
              noBorder
              user={user}
              isNotAllowed={isNotAllowed}
            />
          </div>
        )}
        {properties.assignee && (
          <div className="flex items-center text-xs text-custom-text-200 text-center p-2 group-hover:bg-custom-background-80 border-custom-border-200">
            <ViewAssigneeSelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              position="left"
              tooltipPosition={tooltipPosition}
              customButton
              user={user}
              isNotAllowed={isNotAllowed}
            />
          </div>
        )}
        {properties.labels && (
          <div className="flex items-center text-xs text-custom-text-200 text-center p-2 group-hover:bg-custom-background-80 border-custom-border-200">
            <ViewIssueLabel labelDetails={issue.label_details} maxRender={1} />
          </div>
        )}

        {properties.start_date && (
          <div className="flex items-center text-xs text-custom-text-200 text-center p-2 group-hover:bg-custom-background-80 border-custom-border-200">
            <ViewStartDateSelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              tooltipPosition={tooltipPosition}
              noBorder
              user={user}
              isNotAllowed={isNotAllowed}
            />
          </div>
        )}

        {properties.due_date && (
          <div className="flex items-center text-xs text-custom-text-200 text-center p-2 group-hover:bg-custom-background-80 border-custom-border-200">
            <ViewDueDateSelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              tooltipPosition={tooltipPosition}
              noBorder
              user={user}
              isNotAllowed={isNotAllowed}
            />
          </div>
        )}
        {properties.estimate && (
          <div className="flex items-center text-xs text-custom-text-200 text-center p-2 group-hover:bg-custom-background-80 border-custom-border-200">
            <ViewEstimateSelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              position="left"
              tooltipPosition={tooltipPosition}
              user={user}
              isNotAllowed={isNotAllowed}
            />
          </div>
        )}
        {properties.created_on && (
          <div className="flex items-center text-xs cursor-default text-custom-text-200 text-center p-2 group-hover:bg-custom-background-80 border-custom-border-200">
            {renderLongDetailDateFormat(issue.created_at)}
          </div>
        )}
        {properties.updated_on && (
          <div className="flex items-center text-xs cursor-default text-custom-text-200 text-center p-2 group-hover:bg-custom-background-80 border-custom-border-200">
            {renderLongDetailDateFormat(issue.updated_at)}
          </div>
        )}
      </div>
    </>
  );
};
