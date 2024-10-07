"use client";

import Link from "next/link";
import { TAssignedIssuesWidgetResponse, TCreatedIssuesWidgetResponse, TIssue, TIssuesListTypes } from "@plane/types";
// hooks
// components
import { Loader, getButtonStyling } from "@plane/ui";
import {
  AssignedCompletedIssueListItem,
  AssignedIssuesEmptyState,
  AssignedOverdueIssueListItem,
  AssignedUpcomingIssueListItem,
  CreatedCompletedIssueListItem,
  CreatedIssuesEmptyState,
  CreatedOverdueIssueListItem,
  CreatedUpcomingIssueListItem,
  IssueListItemProps,
} from "@/components/dashboard/widgets";
// ui
// helpers
import { cn } from "@/helpers/common.helper";
import { getRedirectionFilters } from "@/helpers/dashboard.helper";
// hooks
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
import { usePlatformOS } from "@/hooks/use-platform-os";

export type WidgetIssuesListProps = {
  isLoading: boolean;
  tab: TIssuesListTypes;
  type: "assigned" | "created";
  widgetStats: TAssignedIssuesWidgetResponse | TCreatedIssuesWidgetResponse;
  workspaceSlug: string;
};

export const WidgetIssuesList: React.FC<WidgetIssuesListProps> = (props) => {
  const { isLoading, tab, type, widgetStats, workspaceSlug } = props;
  // hooks
  const { isMobile } = usePlatformOS();
  const { handleRedirection } = useIssuePeekOverviewRedirection();

  // handlers
  const handleIssuePeekOverview = (issue: TIssue) => handleRedirection(workspaceSlug, issue, isMobile);

  const filterParams = getRedirectionFilters(tab);

  const ISSUE_LIST_ITEM: {
    [key: string]: {
      [key in TIssuesListTypes]: React.FC<IssueListItemProps>;
    };
  } = {
    assigned: {
      pending: AssignedUpcomingIssueListItem,
      upcoming: AssignedUpcomingIssueListItem,
      overdue: AssignedOverdueIssueListItem,
      completed: AssignedCompletedIssueListItem,
    },
    created: {
      pending: CreatedUpcomingIssueListItem,
      upcoming: CreatedUpcomingIssueListItem,
      overdue: CreatedOverdueIssueListItem,
      completed: CreatedCompletedIssueListItem,
    },
  };

  const issuesList = widgetStats.issues;

  return (
    <>
      <div className="h-full">
        {isLoading ? (
          <Loader className="space-y-4 mt-7">
            <Loader.Item height="25px" />
            <Loader.Item height="25px" />
            <Loader.Item height="25px" />
            <Loader.Item height="25px" />
          </Loader>
        ) : issuesList.length > 0 ? (
          <>
            <div className="mt-7 border-b-[0.5px] border-custom-border-200 grid grid-cols-12 gap-1 text-xs text-custom-text-300 pb-1">
              <h6
                className={cn("pl-1 flex items-center gap-1 col-span-7", {
                  "col-span-11": type === "assigned" && tab === "completed",
                  "col-span-9": type === "created" && tab === "completed",
                })}
              >
                Issues
                <span className="flex-shrink-0 bg-custom-primary-100/20 text-custom-primary-100 text-xs font-medium rounded-xl px-2 flex items-center text-center justify-center">
                  {widgetStats.count}
                </span>
              </h6>
              <h6 className="text-center col-span-1">Priority</h6>
              {["upcoming", "pending"].includes(tab) && <h6 className="text-center col-span-2">Due date</h6>}
              {tab === "overdue" && <h6 className="text-center col-span-2">Due by</h6>}
              {type === "assigned" && tab !== "completed" && <h6 className="text-center col-span-2">Blocked by</h6>}
              {type === "created" && <h6 className="text-center col-span-2">Assigned to</h6>}
            </div>
            <div className="pb-3 mt-2">
              {issuesList.map((issue) => {
                const IssueListItem = ISSUE_LIST_ITEM[type][tab];

                if (!IssueListItem) return null;

                return (
                  <IssueListItem
                    key={issue.id}
                    issueId={issue.id}
                    workspaceSlug={workspaceSlug}
                    onClick={handleIssuePeekOverview}
                  />
                );
              })}
            </div>
          </>
        ) : (
          <div className="h-full grid place-items-center my-6">
            {type === "assigned" && <AssignedIssuesEmptyState type={tab} />}
            {type === "created" && <CreatedIssuesEmptyState type={tab} />}
          </div>
        )}
      </div>
      {!isLoading && issuesList.length > 0 && (
        <Link
          href={`/${workspaceSlug}/workspace-views/${type}/${filterParams}`}
          className={cn(
            getButtonStyling("link-primary", "sm"),
            "w-min my-3 mx-auto py-1 px-2 text-xs hover:bg-custom-primary-100/20"
          )}
        >
          View all issues
        </Link>
      )}
    </>
  );
};
