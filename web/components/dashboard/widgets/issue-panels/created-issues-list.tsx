import Link from "next/link";
// hooks
import { useIssueDetail } from "hooks/store";
// components
import {
  CreatedCompletedIssueListItem,
  CreatedOverdueIssueListItem,
  CreatedUpcomingIssueListItem,
} from "components/dashboard";
import { CreatedIssuesEmptyState } from "components/dashboard/widgets";
// ui
import { Loader, getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "helpers/common.helper";
import { getRedirectionFilters } from "helpers/dashboard.helper";
// types
import { TDurationFilterOptions, TIssue, TIssuesListTypes } from "@plane/types";

type Props = {
  filter: TDurationFilterOptions | undefined;
  issues: TIssue[];
  isLoading?: boolean;
  totalIssues: number;
  type: TIssuesListTypes;
  workspaceSlug: string;
};

export const CreatedIssuesList: React.FC<Props> = (props) => {
  const { filter, issues, isLoading = false, totalIssues, type, workspaceSlug } = props;
  // store hooks
  const { setPeekIssue } = useIssueDetail();

  const handleIssuePeekOverview = (issue: TIssue) =>
    setPeekIssue({ workspaceSlug, projectId: issue.project_id, issueId: issue.id });

  const filterParams = getRedirectionFilters(type);

  return (
    <>
      <div className="h-full">
        {isLoading ? (
          <Loader className="mx-6 mt-2 space-y-4">
            <Loader.Item height="25px" />
            <Loader.Item height="25px" />
            <Loader.Item height="25px" />
            <Loader.Item height="25px" />
          </Loader>
        ) : issues.length > 0 ? (
          <>
            <div className="mx-6 border-b-[0.5px] border-custom-border-200 grid grid-cols-6 gap-1 text-xs text-custom-text-300 pb-1">
              <h6
                className={cn("pl-1 flex items-center gap-1 col-span-4", {
                  "col-span-5": type === "completed",
                })}
              >
                Issues
                <span className="flex-shrink-0 bg-custom-primary-100/20 text-custom-primary-100 text-xs font-medium py-1 px-1.5 rounded-xl h-4 min-w-6 flex items-center text-center justify-center">
                  {totalIssues}
                </span>
              </h6>
              {type === "upcoming" && <h6 className="text-center">Due date</h6>}
              {type === "overdue" && <h6 className="text-center">Due by</h6>}
              <h6 className="text-center">Assigned to</h6>
            </div>
            <div className="px-4 pb-3 mt-2">
              {issues.map((issue) => {
                if (type === "upcoming")
                  return (
                    <CreatedUpcomingIssueListItem
                      key={issue.id}
                      issueId={issue.id}
                      workspaceSlug={workspaceSlug}
                      onClick={handleIssuePeekOverview}
                    />
                  );
                if (type === "overdue")
                  return (
                    <CreatedOverdueIssueListItem
                      key={issue.id}
                      issueId={issue.id}
                      workspaceSlug={workspaceSlug}
                      onClick={handleIssuePeekOverview}
                    />
                  );
                if (type === "completed")
                  return (
                    <CreatedCompletedIssueListItem
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
          <div className="h-full grid items-end">
            <CreatedIssuesEmptyState filter={filter ?? "this_week"} type={type} />
          </div>
        )}
      </div>
      {totalIssues > issues.length && (
        <Link
          href={`/${workspaceSlug}/workspace-views/created/${filterParams}`}
          className={cn(getButtonStyling("accent-primary", "sm"), "w-min my-3 mx-auto py-1 px-2 text-xs")}
        >
          View all issues
        </Link>
      )}
    </>
  );
};
