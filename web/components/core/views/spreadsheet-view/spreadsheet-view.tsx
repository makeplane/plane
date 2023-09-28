import React, { useCallback, useState } from "react";

// next
import { useRouter } from "next/router";

import { KeyedMutator, mutate } from "swr";

// components
import {
  ListInlineCreateIssueForm,
  SpreadsheetAssigneeColumn,
  SpreadsheetCreatedOnColumn,
  SpreadsheetDueDateColumn,
  SpreadsheetEstimateColumn,
  SpreadsheetIssuesColumn,
  SpreadsheetLabelColumn,
  SpreadsheetPriorityColumn,
  SpreadsheetStartDateColumn,
  SpreadsheetStateColumn,
  SpreadsheetUpdatedOnColumn,
} from "components/core";
import { CustomMenu, Spinner } from "components/ui";
import { IssuePeekOverview } from "components/issues";
// hooks
import useIssuesProperties from "hooks/use-issue-properties";
// types
import { ICurrentUserResponse, IIssue, ISubIssueResponse, UserAuth } from "types";
import useWorkspaceIssuesFilters from "hooks/use-worskpace-issue-filter";
import {
  CYCLE_DETAILS,
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_DETAILS,
  MODULE_ISSUES_WITH_PARAMS,
  PROJECT_ISSUES_LIST_WITH_PARAMS,
  SUB_ISSUES,
  VIEW_ISSUES,
  WORKSPACE_VIEW_ISSUES,
} from "constants/fetch-keys";
import useSpreadsheetIssuesView from "hooks/use-spreadsheet-issues-view";
import projectIssuesServices from "services/issues.service";
// icon
import { PlusIcon } from "lucide-react";

type Props = {
  spreadsheetIssues: IIssue[];
  mutateIssues: KeyedMutator<
    | IIssue[]
    | {
        [key: string]: IIssue[];
      }
  >;
  handleIssueAction: (issue: IIssue, action: "copy" | "delete" | "edit") => void;
  openIssuesListModal?: (() => void) | null;
  disableUserActions: boolean;
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
};

export const SpreadsheetView: React.FC<Props> = ({
  spreadsheetIssues,
  mutateIssues,
  handleIssueAction,
  openIssuesListModal,
  disableUserActions,
  user,
  userAuth,
}) => {
  const [expandedIssues, setExpandedIssues] = useState<string[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const [isInlineCreateIssueFormOpen, setIsInlineCreateIssueFormOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId, viewId, workspaceViewId } = router.query;

  const type = cycleId ? "cycle" : moduleId ? "module" : "issue";

  const [properties] = useIssuesProperties(workspaceSlug as string, projectId as string);

  const workspaceIssuesPath = [
    {
      params: {
        sub_issue: false,
      },
      path: "workspace-views/all-issues",
    },
    {
      params: {
        assignees: user?.id ?? undefined,
        sub_issue: false,
      },
      path: "workspace-views/assigned",
    },
    {
      params: {
        created_by: user?.id ?? undefined,
        sub_issue: false,
      },
      path: "workspace-views/created",
    },
    {
      params: {
        subscriber: user?.id ?? undefined,
        sub_issue: false,
      },
      path: "workspace-views/subscribed",
    },
  ];

  const currentWorkspaceIssuePath = workspaceIssuesPath.find((path) =>
    router.pathname.includes(path.path)
  );

  const { params: workspaceViewParams } = useWorkspaceIssuesFilters(
    workspaceSlug?.toString(),
    workspaceViewId?.toString()
  );

  const { params } = useSpreadsheetIssuesView();

  const partialUpdateIssue = useCallback(
    (formData: Partial<IIssue>, issue: IIssue) => {
      if (!workspaceSlug || !issue) return;

      const fetchKey = cycleId
        ? CYCLE_ISSUES_WITH_PARAMS(cycleId.toString(), params)
        : moduleId
        ? MODULE_ISSUES_WITH_PARAMS(moduleId.toString(), params)
        : viewId
        ? VIEW_ISSUES(viewId.toString(), params)
        : workspaceViewId
        ? WORKSPACE_VIEW_ISSUES(workspaceSlug.toString(), workspaceViewParams)
        : currentWorkspaceIssuePath
        ? WORKSPACE_VIEW_ISSUES(workspaceSlug.toString(), currentWorkspaceIssuePath?.params)
        : PROJECT_ISSUES_LIST_WITH_PARAMS(issue.project_detail.id, params);

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

      projectIssuesServices
        .patchIssue(
          workspaceSlug as string,
          issue.project_detail.id,
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
    [
      workspaceSlug,
      cycleId,
      moduleId,
      viewId,
      workspaceViewId,
      currentWorkspaceIssuePath,
      workspaceViewParams,
      params,
      user,
    ]
  );

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  const renderColumn = (header: string, Component: React.ComponentType<any>) => (
    <div className="relative flex flex-col h-max w-full bg-custom-background-100 rounded-sm">
      <div className="flex items-center min-w-[9rem] px-4 py-2.5 text-sm font-medium z-[1] h-11 w-full sticky top-0 bg-custom-background-90 border border-l-0 border-custom-border-200">
        {header}
      </div>
      <div className="h-full min-w-[9rem] w-full">
        {spreadsheetIssues.map((issue: IIssue, index) => (
          <Component
            key={`${issue.id}_${index}`}
            issue={issue}
            projectId={issue.project_detail.id}
            partialUpdateIssue={partialUpdateIssue}
            expandedIssues={expandedIssues}
            properties={properties}
            user={user}
            isNotAllowed={isNotAllowed}
          />
        ))}
      </div>
    </div>
  );

  return (
    <>
      <IssuePeekOverview
        handleMutation={() => mutateIssues()}
        projectId={currentProjectId ?? ""}
        workspaceSlug={workspaceSlug?.toString() ?? ""}
        readOnly={disableUserActions}
      />
      <div className="relative flex h-full w-full rounded-lg text-custom-text-200 overflow-x-auto whitespace-nowrap bg-custom-background-100">
        <div className="h-full w-full flex flex-col">
          <div className="flex max-h-full overflow-y-auto">
            {spreadsheetIssues ? (
              <>
                <div className="sticky left-0 w-[28rem] z-[2]">
                  <div className="relative flex flex-col h-max w-full bg-custom-background-100 rounded-sm z-[2]">
                    <div className="flex items-center text-sm font-medium z-[2] h-11 w-full sticky top-0 bg-custom-background-90 border border-l-0 border-custom-border-200">
                      <span className="flex items-center px-4 py-2.5 h-full w-20 flex-shrink-0">
                        ID
                      </span>
                      <span className="flex items-center px-4 py-2.5 h-full w-full flex-grow">
                        Issue
                      </span>
                    </div>

                    {spreadsheetIssues.map((issue: IIssue, index) => (
                      <SpreadsheetIssuesColumn
                        key={`${issue.id}_${index}`}
                        issue={issue}
                        projectId={issue.project_detail.id}
                        expandedIssues={expandedIssues}
                        setExpandedIssues={setExpandedIssues}
                        setCurrentProjectId={setCurrentProjectId}
                        properties={properties}
                        handleIssueAction={handleIssueAction}
                        disableUserActions={disableUserActions}
                        userAuth={userAuth}
                      />
                    ))}
                  </div>
                </div>
                {renderColumn("State", SpreadsheetStateColumn)}
                {renderColumn("Priority", SpreadsheetPriorityColumn)}
                {renderColumn("Assignees", SpreadsheetAssigneeColumn)}
                {renderColumn("Label", SpreadsheetLabelColumn)}
                {renderColumn("Start Date", SpreadsheetStartDateColumn)}
                {renderColumn("Due Date", SpreadsheetDueDateColumn)}
                {renderColumn("Estimate", SpreadsheetEstimateColumn)}
                {renderColumn("Created On", SpreadsheetCreatedOnColumn)}
                {renderColumn("Updated On", SpreadsheetUpdatedOnColumn)}
              </>
            ) : (
              <div className="flex flex-col justify-center items-center h-full w-full">
                <Spinner />
              </div>
            )}
          </div>

          <div className="border-t border-custom-border-100">
            <div className="mb-3 z-50 sticky bottom-0 left-0">
              <ListInlineCreateIssueForm
                isOpen={isInlineCreateIssueFormOpen}
                handleClose={() => setIsInlineCreateIssueFormOpen(false)}
                prePopulatedData={{
                  ...(cycleId && { cycle: cycleId.toString() }),
                  ...(moduleId && { module: moduleId.toString() }),
                }}
              />
            </div>

            {type === "issue"
              ? !disableUserActions &&
                !isInlineCreateIssueFormOpen && (
                  <button
                    className="flex gap-1.5 items-center text-custom-primary-100 pl-4 py-2.5 text-sm sticky left-0 z-[1] w-full"
                    onClick={() => setIsInlineCreateIssueFormOpen(true)}
                  >
                    <PlusIcon className="h-4 w-4" />
                    New Issue
                  </button>
                )
              : !disableUserActions &&
                !isInlineCreateIssueFormOpen && (
                  <CustomMenu
                    className="sticky left-0 z-10"
                    customButton={
                      <button
                        className="flex gap-1.5 items-center text-custom-primary-100 pl-4 py-2.5 text-sm sticky left-0 z-[1] border-custom-border-200 w-full"
                        type="button"
                      >
                        <PlusIcon className="h-4 w-4" />
                        New Issue
                      </button>
                    }
                    position="left"
                    verticalPosition="top"
                    optionsClassName="left-5 !w-36"
                    noBorder
                  >
                    <CustomMenu.MenuItem onClick={() => setIsInlineCreateIssueFormOpen(true)}>
                      Create new
                    </CustomMenu.MenuItem>
                    {openIssuesListModal && (
                      <CustomMenu.MenuItem onClick={openIssuesListModal}>
                        Add an existing issue
                      </CustomMenu.MenuItem>
                    )}
                  </CustomMenu>
                )}
          </div>
        </div>
      </div>
    </>
  );
};
