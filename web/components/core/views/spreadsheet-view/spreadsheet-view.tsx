import React, { useCallback, useEffect, useRef, useState } from "react";

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
import { CustomMenu, Icon, Spinner } from "components/ui";
import { IssuePeekOverview } from "components/issues";
// hooks
import useIssuesProperties from "hooks/use-issue-properties";
import useLocalStorage from "hooks/use-local-storage";
import { useWorkspaceView } from "hooks/use-workspace-view";
// types
import {
  ICurrentUserResponse,
  IIssue,
  ISubIssueResponse,
  TIssueOrderByOptions,
  UserAuth,
} from "types";
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
import { CheckIcon, ChevronDownIcon, PlusIcon } from "lucide-react";

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

  const [isScrolled, setIsScrolled] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId, viewId, workspaceViewId } = router.query;

  const type = cycleId ? "cycle" : moduleId ? "module" : "issue";

  const [properties] = useIssuesProperties(workspaceSlug as string, projectId as string);

  const { storedValue: selectedMenuItem, setValue: setSelectedMenuItem } = useLocalStorage(
    "spreadsheetViewSorting",
    ""
  );
  const { storedValue: activeSortingProperty, setValue: setActiveSortingProperty } =
    useLocalStorage("spreadsheetViewActiveSortingProperty", "");

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

  const { params: workspaceViewParams, handleFilters } = useWorkspaceView();

  const { params, displayFilters, setDisplayFilters } = useSpreadsheetIssuesView();

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
      workspaceViewParams,
      currentWorkspaceIssuePath,
      params,
      user,
    ]
  );

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  const handleOrderBy = (order: TIssueOrderByOptions, itemKey: string) => {
    if (!workspaceViewId || !currentWorkspaceIssuePath)
      handleFilters("display_filters", { order_by: order });
    else setDisplayFilters({ order_by: order });
    setSelectedMenuItem(`${order}_${itemKey}`);
    setActiveSortingProperty(order === "-created_at" ? "" : itemKey);
  };

  const renderColumn = (
    header: string,
    propertyName: string,
    Component: React.ComponentType<any>,
    ascendingOrder: TIssueOrderByOptions,
    descendingOrder: TIssueOrderByOptions
  ) => (
    <div className="relative flex flex-col h-max w-full bg-custom-background-100">
      <div className="flex items-center min-w-[9rem] px-4 py-2.5 text-sm font-medium z-[1] h-11 w-full sticky top-0 bg-custom-background-90 border border-l-0 border-custom-border-200">
        <CustomMenu
          customButtonClassName="!w-full"
          className="!w-full"
          position="left"
          customButton={
            <div
              className={`relative group flex items-center justify-between gap-1.5 cursor-pointer text-sm text-custom-text-200 hover:text-custom-text-100 w-full py-3 px-2 ${
                activeSortingProperty === propertyName ? "bg-custom-background-80" : ""
              }`}
            >
              {activeSortingProperty === propertyName && (
                <div className="absolute top-1 right-1.5">
                  <Icon
                    iconName="filter_list"
                    className="flex items-center justify-center h-3.5 w-3.5 rounded-full bg-custom-primary text-xs text-white"
                  />
                </div>
              )}

              {header}
              <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
            </div>
          }
          width="xl"
        >
          <CustomMenu.MenuItem
            onClick={() => {
              handleOrderBy(ascendingOrder, propertyName);
            }}
          >
            <div
              className={`group flex gap-1.5 px-1 items-center justify-between ${
                selectedMenuItem === `${ascendingOrder}_${propertyName}`
                  ? "text-custom-text-100"
                  : "text-custom-text-200 hover:text-custom-text-100"
              }`}
            >
              <div className="flex gap-2 items-center">
                {propertyName === "assignee" || propertyName === "labels" ? (
                  <>
                    <span className="relative flex items-center h-6 w-6">
                      <Icon
                        iconName="east"
                        className="absolute left-0 rotate-90 text-xs leading-3"
                      />
                      <Icon iconName="sort" className="absolute right-0 text-sm" />
                    </span>
                    <span>A</span>
                    <Icon iconName="east" className="text-sm" />
                    <span>Z</span>
                  </>
                ) : propertyName === "due_date" ||
                  propertyName === "created_on" ||
                  propertyName === "updated_on" ? (
                  <>
                    <span className="relative flex items-center h-6 w-6">
                      <Icon
                        iconName="east"
                        className="absolute left-0 rotate-90 text-xs leading-3"
                      />
                      <Icon iconName="sort" className="absolute right-0 text-sm" />
                    </span>
                    <span>New</span>
                    <Icon iconName="east" className="text-sm" />
                    <span>Old</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex items-center h-6 w-6">
                      <Icon
                        iconName="east"
                        className="absolute left-0 rotate-90 text-xs leading-3"
                      />
                      <Icon iconName="sort" className="absolute right-0 text-sm" />
                    </span>
                    <span>First</span>
                    <Icon iconName="east" className="text-sm" />
                    <span>Last</span>
                  </>
                )}
              </div>

              <CheckIcon
                className={`h-3.5 w-3.5 opacity-0 group-hover:opacity-100 ${
                  selectedMenuItem === `${ascendingOrder}_${propertyName}` ? "opacity-100" : ""
                }`}
              />
            </div>
          </CustomMenu.MenuItem>
          <CustomMenu.MenuItem
            className={`mt-0.5 ${
              selectedMenuItem === `${descendingOrder}_${propertyName}`
                ? "bg-custom-background-80"
                : ""
            }`}
            key={propertyName}
            onClick={() => {
              handleOrderBy(descendingOrder, propertyName);
            }}
          >
            <div
              className={`group flex gap-1.5 px-1 items-center justify-between ${
                selectedMenuItem === `${descendingOrder}_${propertyName}`
                  ? "text-custom-text-100"
                  : "text-custom-text-200 hover:text-custom-text-100"
              }`}
            >
              <div className="flex gap-2 items-center">
                {propertyName === "assignee" || propertyName === "labels" ? (
                  <>
                    <span className="relative flex items-center h-6 w-6">
                      <Icon
                        iconName="east"
                        className="absolute left-0 -rotate-90 text-xs leading-3"
                      />
                      <Icon
                        iconName="sort"
                        className="absolute rotate-180 transform scale-x-[-1] right-0 text-sm"
                      />
                    </span>
                    <span>Z</span>
                    <Icon iconName="east" className="text-sm" />
                    <span>A</span>
                  </>
                ) : propertyName === "due_date" ? (
                  <>
                    <span className="relative flex items-center h-6 w-6">
                      <Icon
                        iconName="east"
                        className="absolute left-0 -rotate-90 text-xs leading-3"
                      />
                      <Icon
                        iconName="sort"
                        className="absolute rotate-180 transform scale-x-[-1] right-0 text-sm"
                      />
                    </span>
                    <span>Old</span>
                    <Icon iconName="east" className="text-sm" />
                    <span>New</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex items-center h-6 w-6">
                      <Icon
                        iconName="east"
                        className="absolute left-0 -rotate-90 text-xs leading-3"
                      />
                      <Icon
                        iconName="sort"
                        className="absolute rotate-180 transform scale-x-[-1] right-0 text-sm"
                      />
                    </span>
                    <span>Last</span>
                    <Icon iconName="east" className="text-sm" />
                    <span>First</span>
                  </>
                )}
              </div>

              <CheckIcon
                className={`h-3.5 w-3.5 opacity-0 group-hover:opacity-100 ${
                  selectedMenuItem === `${descendingOrder}_${propertyName}` ? "opacity-100" : ""
                }`}
              />
            </div>
          </CustomMenu.MenuItem>
          {selectedMenuItem &&
            selectedMenuItem !== "" &&
            displayFilters?.order_by !== "-created_at" &&
            selectedMenuItem.includes(propertyName) && (
              <CustomMenu.MenuItem
                className={`mt-0.5${
                  selectedMenuItem === `-created_at_${propertyName}`
                    ? "bg-custom-background-80"
                    : ""
                }`}
                key={propertyName}
                onClick={() => {
                  handleOrderBy("-created_at", propertyName);
                }}
              >
                <div className={`group flex gap-1.5 px-1 items-center justify-between `}>
                  <div className="flex gap-1.5 items-center">
                    <span className="relative flex items-center justify-center h-6 w-6">
                      <Icon iconName="ink_eraser" className="text-sm" />
                    </span>

                    <span>Clear sorting</span>
                  </div>
                </div>
              </CustomMenu.MenuItem>
            )}
        </CustomMenu>
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

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollLeft = containerRef.current.scrollLeft;
      setIsScrolled(scrollLeft > 0);
    }
  };

  useEffect(() => {
    const currentContainerRef = containerRef.current;

    if (currentContainerRef) {
      currentContainerRef.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (currentContainerRef) {
        currentContainerRef.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  return (
    <>
      <IssuePeekOverview
        handleMutation={() => mutateIssues()}
        projectId={currentProjectId ?? ""}
        workspaceSlug={workspaceSlug?.toString() ?? ""}
        readOnly={disableUserActions}
      />
      <div className="relative flex h-full w-full rounded-lg text-custom-text-200 overflow-x-auto whitespace-nowrap bg-custom-background-200">
        <div className="h-full w-full flex flex-col">
          <div ref={containerRef} className="flex max-h-full h-full overflow-y-auto">
            {spreadsheetIssues ? (
              <>
                <div className="sticky left-0 w-[28rem] z-[2]">
                  <div
                    className={`relative flex flex-col h-max w-full bg-custom-background-100 z-[2] ${
                      isScrolled ? "shadow-r shadow-custom-shadow-xs" : ""
                    }`}
                  >
                    <div className="flex items-center text-sm font-medium z-[2] h-11 w-full sticky top-0 bg-custom-background-90 border border-l-0 border-custom-border-200">
                      <span className="flex items-center px-4 py-2.5 h-full w-24 flex-shrink-0">
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
                {renderColumn(
                  "State",
                  "state",
                  SpreadsheetStateColumn,
                  "state__name",
                  "-state__name"
                )}
                {renderColumn(
                  "Priority",
                  "priority",
                  SpreadsheetPriorityColumn,
                  "priority",
                  "-priority"
                )}
                {renderColumn(
                  "Assignees",
                  "assignee",
                  SpreadsheetAssigneeColumn,
                  "assignees__first_name",
                  "-assignees__first_name"
                )}
                {renderColumn(
                  "Label",
                  "labels",
                  SpreadsheetLabelColumn,
                  "labels__name",
                  "-labels__name"
                )}
                {renderColumn(
                  "Start Date",
                  "start_date",
                  SpreadsheetStartDateColumn,
                  "-start_date",
                  "start_date"
                )}
                {renderColumn(
                  "Due Date",
                  "due_date",
                  SpreadsheetDueDateColumn,
                  "-target_date",
                  "target_date"
                )}
                {renderColumn(
                  "Estimate",
                  "estimate",
                  SpreadsheetEstimateColumn,
                  "estimate_point",
                  "-estimate_point"
                )}
                {renderColumn(
                  "Created On",
                  "created_on",
                  SpreadsheetCreatedOnColumn,
                  "-created_at",
                  "created_at"
                )}
                {renderColumn(
                  "Updated On",
                  "updated_on",
                  SpreadsheetUpdatedOnColumn,
                  "-updated_at",
                  "updated_at"
                )}
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
