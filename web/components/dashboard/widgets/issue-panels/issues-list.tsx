import Link from "next/link";
// hooks
import { useIssueDetail } from "hooks/store";
// components
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
} from "components/dashboard/widgets";
// ui
import { Loader, getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "helpers/common.helper";
import { getRedirectionFilters } from "helpers/dashboard.helper";
// types
import { TIssue, TIssuesListTypes } from "@plane/types";

export type WidgetIssuesListProps = {
  isLoading: boolean;
  issues: TIssue[];
  tab: TIssuesListTypes;
  totalIssues: number;
  type: "assigned" | "created";
  workspaceSlug: string;
};

export const WidgetIssuesList: React.FC<WidgetIssuesListProps> = (props) => {
  const { isLoading, issues, tab, totalIssues, type, workspaceSlug } = props;
  // store hooks
  const { setPeekIssue } = useIssueDetail();

  const handleIssuePeekOverview = (issue: TIssue) =>
    setPeekIssue({ workspaceSlug, projectId: issue.project_id, issueId: issue.id });

  const filterParams = getRedirectionFilters(tab);

  const ISSUE_LIST_ITEM: {
    [key in string]: {
      [key in TIssuesListTypes]: React.FC<IssueListItemProps>;
    };
  } = {
    assigned: {
      upcoming: AssignedUpcomingIssueListItem,
      overdue: AssignedOverdueIssueListItem,
      completed: AssignedCompletedIssueListItem,
    },
    created: {
      upcoming: CreatedUpcomingIssueListItem,
      overdue: CreatedOverdueIssueListItem,
      completed: CreatedCompletedIssueListItem,
    },
  };

  return (
    <>
      <div className="h-full">
        {isLoading ? (
          <Loader className="mt-7 mx-6 space-y-4">
            <Loader.Item height="25px" />
            <Loader.Item height="25px" />
            <Loader.Item height="25px" />
            <Loader.Item height="25px" />
          </Loader>
        ) : issues.length > 0 ? (
          <>
            <div className="mt-7 mx-6 border-b-[0.5px] border-custom-border-200 grid grid-cols-6 gap-1 text-xs text-custom-text-300 pb-1">
              <h6
                className={cn("pl-1 flex items-center gap-1 col-span-4", {
                  "col-span-6": type === "assigned" && tab === "completed",
                  "col-span-5": type === "created" && tab === "completed",
                })}
              >
                Issues
                <span className="flex-shrink-0 bg-custom-primary-100/20 text-custom-primary-100 text-xs font-medium rounded-xl px-3 flex items-center text-center justify-center">
                  {totalIssues}
                </span>
              </h6>
              {tab === "upcoming" && <h6 className="text-center">Due date</h6>}
              {tab === "overdue" && <h6 className="text-center">Due by</h6>}
              {type === "assigned" && tab !== "completed" && <h6 className="text-center">Blocked by</h6>}
              {type === "created" && <h6 className="text-center">Assigned to</h6>}
            </div>
            <div className="px-4 pb-3 mt-2">
              {issues.map((issue) => {
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
          <div className="h-full grid place-items-center">
            {type === "assigned" && <AssignedIssuesEmptyState type={tab} />}
            {type === "created" && <CreatedIssuesEmptyState type={tab} />}
          </div>
        )}
      </div>
      {issues.length > 0 && (
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
