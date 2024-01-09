// components
import {
  CreatedCompletedIssueListItem,
  CreatedOverdueIssueListItem,
  CreatedUpcomingIssueListItem,
} from "components/dashboard";
// ui
import { Button } from "@plane/ui";
// helpers
import { cn } from "helpers/common.helper";
// types
import { IWidgetIssue } from "@plane/types";

type Props = {
  issues: IWidgetIssue[];
  totalIssues: number;
  type: "upcoming" | "overdue" | "completed";
  workspaceSlug: string;
};

export const CreatedIssuesList: React.FC<Props> = (props) => {
  const { issues, totalIssues, type, workspaceSlug } = props;

  return (
    <>
      <div>
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
        <div className="px-4 mt-2">
          {issues.map((issue) => {
            if (type === "upcoming")
              return <CreatedUpcomingIssueListItem key={issue.id} issue={issue} workspaceSlug={workspaceSlug} />;
            if (type === "overdue")
              return <CreatedOverdueIssueListItem key={issue.id} issue={issue} workspaceSlug={workspaceSlug} />;
            if (type === "completed")
              return <CreatedCompletedIssueListItem key={issue.id} issue={issue} workspaceSlug={workspaceSlug} />;
          })}
        </div>
      </div>
      {totalIssues > issues.length && (
        <div className="mt-6 text-center">
          <Button type="button" variant="accent-primary" className="py-1 px-2 text-xs">
            View all issues
          </Button>
        </div>
      )}
    </>
  );
};
