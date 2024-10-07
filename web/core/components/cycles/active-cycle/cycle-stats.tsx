"use client";

import { FC, Fragment, useCallback, useRef, useState } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { CalendarCheck } from "lucide-react";
// headless ui
import { Tab } from "@headlessui/react";
// types
import { ICycle, IIssueFilterOptions } from "@plane/types";
// ui
import { Tooltip, Loader, PriorityIcon, Avatar } from "@plane/ui";
// components
import { SingleProgressStats } from "@/components/core";
import { StateDropdown } from "@/components/dropdowns";
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { EIssuesStoreType } from "@/constants/issue";
// helper
import { cn } from "@/helpers/common.helper";
import { renderFormattedDate, renderFormattedDateWithoutYear } from "@/helpers/date-time.helper";
// hooks
import { useIssueDetail, useIssues } from "@/hooks/store";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import useLocalStorage from "@/hooks/use-local-storage";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues";
import { ActiveCycleIssueDetails } from "@/store/issue/cycle";

export type ActiveCycleStatsProps = {
  workspaceSlug: string;
  projectId: string;
  cycle: ICycle | null;
  cycleId?: string | null;
  handleFiltersUpdate: (key: keyof IIssueFilterOptions, value: string[], redirect?: boolean) => void;
  cycleIssueDetails: ActiveCycleIssueDetails;
};

export const ActiveCycleStats: FC<ActiveCycleStatsProps> = observer((props) => {
  const { workspaceSlug, projectId, cycle, cycleId, handleFiltersUpdate, cycleIssueDetails } = props;

  const { storedValue: tab, setValue: setTab } = useLocalStorage("activeCycleTab", "Assignees");

  const issuesContainerRef = useRef<HTMLDivElement | null>(null);
  const [issuesLoaderElement, setIssueLoaderElement] = useState<HTMLDivElement | null>(null);

  const currentValue = (tab: string | null) => {
    switch (tab) {
      case "Priority-Issues":
        return 0;
      case "Assignees":
        return 1;
      case "Labels":
        return 2;
      default:
        return 0;
    }
  };
  const {
    issues: { fetchNextActiveCycleIssues },
  } = useIssues(EIssuesStoreType.CYCLE);
  const {
    issue: { getIssueById },
    setPeekIssue,
  } = useIssueDetail();
  const loadMoreIssues = useCallback(() => {
    if (!cycleId) return;
    fetchNextActiveCycleIssues(workspaceSlug, projectId, cycleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, projectId, cycleId, issuesLoaderElement, cycleIssueDetails?.nextPageResults]);

  useIntersectionObserver(issuesContainerRef, issuesLoaderElement, loadMoreIssues, `0% 0% 100% 0%`);

  const loaders = (
    <Loader className="space-y-3">
      <Loader.Item height="30px" />
      <Loader.Item height="30px" />
      <Loader.Item height="30px" />
    </Loader>
  );

  return cycleId ? (
    <div className="flex flex-col gap-4 p-4 min-h-[17rem] overflow-hidden bg-custom-background-100 col-span-1 lg:col-span-2 xl:col-span-1 border border-custom-border-200 rounded-lg">
      <Tab.Group
        as={Fragment}
        defaultIndex={currentValue(tab)}
        onChange={(i) => {
          switch (i) {
            case 0:
              return setTab("Priority-Issues");
            case 1:
              return setTab("Assignees");
            case 2:
              return setTab("Labels");

            default:
              return setTab("Priority-Issues");
          }
        }}
      >
        <Tab.List
          as="div"
          className="relative border-[0.5px] border-custom-border-200 rounded bg-custom-background-80 p-[1px] grid"
          style={{
            gridTemplateColumns: `repeat(3, 1fr)`,
          }}
        >
          <Tab
            className={({ selected }) =>
              cn(
                "relative z-[1] font-semibold text-xs rounded-[3px] py-1.5 text-custom-text-400 focus:outline-none transition duration-500",
                {
                  "text-custom-text-300 bg-custom-background-100": selected,
                  "hover:text-custom-text-300": !selected,
                }
              )
            }
          >
            Priority Issues
          </Tab>
          <Tab
            className={({ selected }) =>
              cn(
                "relative z-[1] font-semibold text-xs rounded-[3px] py-1.5 text-custom-text-400 focus:outline-none transition duration-500",
                {
                  "text-custom-text-300 bg-custom-background-100": selected,
                  "hover:text-custom-text-300": !selected,
                }
              )
            }
          >
            Assignees
          </Tab>
          <Tab
            className={({ selected }) =>
              cn(
                "relative z-[1] font-semibold text-xs rounded-[3px] py-1.5 text-custom-text-400 focus:outline-none transition duration-500",
                {
                  "text-custom-text-300 bg-custom-background-100": selected,
                  "hover:text-custom-text-300": !selected,
                }
              )
            }
          >
            Labels
          </Tab>
        </Tab.List>

        <Tab.Panels as={Fragment}>
          <Tab.Panel
            as="div"
            className="flex h-52 w-full flex-col gap-1 overflow-y-auto  text-custom-text-200 vertical-scrollbar scrollbar-sm"
          >
            <div
              ref={issuesContainerRef}
              className="flex flex-col gap-1 h-full w-full overflow-y-auto vertical-scrollbar scrollbar-sm"
            >
              {cycleIssueDetails && "issueIds" in cycleIssueDetails ? (
                cycleIssueDetails.issueCount > 0 ? (
                  <>
                    {cycleIssueDetails.issueIds.map((issueId: string) => {
                      const issue = getIssueById(issueId);

                      if (!issue) return null;

                      return (
                        <div
                          key={issue.id}
                          className="group flex cursor-pointer items-center justify-between gap-2 rounded-md hover:bg-custom-background-90 p-1"
                          onClick={() => {
                            if (issue.id) {
                              setPeekIssue({ workspaceSlug, projectId, issueId: issue.id });
                              handleFiltersUpdate("priority", ["urgent", "high"], true);
                            }
                          }}
                        >
                          <div className="flex items-center gap-1.5 flex-grow w-full min-w-24 truncate">
                            <IssueIdentifier
                              issueId={issue.id}
                              projectId={projectId}
                              textContainerClassName="text-xs text-custom-text-200"
                            />
                            <Tooltip position="top-left" tooltipHeading="Title" tooltipContent={issue.name}>
                              <span className="text-[0.825rem] text-custom-text-100 truncate">{issue.name}</span>
                            </Tooltip>
                          </div>
                          <PriorityIcon priority={issue.priority} withContainer size={12} />
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <StateDropdown
                              value={issue.state_id}
                              onChange={() => {}}
                              projectId={projectId?.toString() ?? ""}
                              disabled
                              buttonVariant="background-with-text"
                              buttonContainerClassName="cursor-pointer max-w-24"
                              showTooltip
                            />
                            {issue.target_date && (
                              <Tooltip
                                tooltipHeading="Target Date"
                                tooltipContent={renderFormattedDate(issue.target_date)}
                              >
                                <div className="h-full flex truncate items-center gap-1.5 rounded text-xs px-2 py-0.5 bg-custom-background-80 group-hover:bg-custom-background-100 cursor-pointer">
                                  <CalendarCheck className="h-3 w-3 flex-shrink-0" />
                                  <span className="text-xs truncate">
                                    {renderFormattedDateWithoutYear(issue.target_date)}
                                  </span>
                                </div>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {(cycleIssueDetails.nextPageResults === undefined || cycleIssueDetails.nextPageResults) && (
                      <div
                        ref={setIssueLoaderElement}
                        className={
                          "h-11 relative flex items-center gap-3 bg-custom-background-80 p-3 text-sm cursor-pointer animate-pulse"
                        }
                      />
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full w-full">
                    <EmptyState
                      type={EmptyStateType.ACTIVE_CYCLE_PRIORITY_ISSUE_EMPTY_STATE}
                      layout="screen-simple"
                      size="sm"
                    />
                  </div>
                )
              ) : (
                loaders
              )}
            </div>
          </Tab.Panel>

          <Tab.Panel
            as="div"
            className="flex h-52 w-full flex-col gap-1 overflow-y-auto text-custom-text-200 vertical-scrollbar scrollbar-sm"
          >
            {cycle && !isEmpty(cycle.distribution) ? (
              cycle?.distribution?.assignees && cycle.distribution.assignees.length > 0 ? (
                cycle.distribution?.assignees?.map((assignee, index) => {
                  if (assignee.assignee_id)
                    return (
                      <SingleProgressStats
                        key={assignee.assignee_id}
                        title={
                          <div className="flex items-center gap-2">
                            <Avatar name={assignee?.display_name ?? undefined} src={assignee?.avatar ?? undefined} />

                            <span>{assignee.display_name}</span>
                          </div>
                        }
                        completed={assignee.completed_issues}
                        total={assignee.total_issues}
                        onClick={() => {
                          if (assignee.assignee_id) {
                            handleFiltersUpdate("assignees", [assignee.assignee_id], true);
                          }
                        }}
                      />
                    );
                  else
                    return (
                      <SingleProgressStats
                        key={`unassigned-${index}`}
                        title={
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full border-2 border-custom-border-200 bg-custom-background-80">
                              <img src="/user.png" height="100%" width="100%" className="rounded-full" alt="User" />
                            </div>
                            <span>No assignee</span>
                          </div>
                        }
                        completed={assignee.completed_issues}
                        total={assignee.total_issues}
                      />
                    );
                })
              ) : (
                <div className="flex items-center justify-center h-full w-full">
                  <EmptyState
                    type={EmptyStateType.ACTIVE_CYCLE_ASSIGNEE_EMPTY_STATE}
                    layout="screen-simple"
                    size="sm"
                  />
                </div>
              )
            ) : (
              loaders
            )}
          </Tab.Panel>

          <Tab.Panel
            as="div"
            className="flex h-52 w-full flex-col gap-1 overflow-y-auto  text-custom-text-200 vertical-scrollbar scrollbar-sm"
          >
            {cycle && !isEmpty(cycle.distribution) ? (
              cycle?.distribution?.labels && cycle.distribution.labels.length > 0 ? (
                cycle.distribution.labels?.map((label, index) => (
                  <SingleProgressStats
                    key={label.label_id ?? `no-label-${index}`}
                    title={
                      <div className="flex items-center gap-2">
                        <span
                          className="block h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: label.color ?? "#000000",
                          }}
                        />
                        <span className="text-xs">{label.label_name ?? "No labels"}</span>
                      </div>
                    }
                    completed={label.completed_issues}
                    total={label.total_issues}
                    onClick={() => {
                      if (label.label_id) {
                        handleFiltersUpdate("labels", [label.label_id], true);
                      }
                    }}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center h-full w-full">
                  <EmptyState type={EmptyStateType.ACTIVE_CYCLE_LABEL_EMPTY_STATE} layout="screen-simple" size="sm" />
                </div>
              )
            ) : (
              loaders
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  ) : (
    <Loader className="flex flex-col gap-4 min-h-[17rem] overflow-hidden bg-custom-background-100 col-span-1 lg:col-span-2 xl:col-span-1">
      <Loader.Item width="100%" height="17rem" />
    </Loader>
  );
});
