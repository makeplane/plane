import Link from "next/link";
// components
import { PriorityDropdown } from "components/dropdowns";
// ui
import { Button } from "@plane/ui";
// types
import { IWidgetIssue } from "@plane/types";

type Props = {
  issues: IWidgetIssue[];
  totalIssues: number;
  workspaceSlug: string;
};

export const CompletedIssuesPanel: React.FC<Props> = (props) => {
  const { issues, totalIssues, workspaceSlug } = props;

  return (
    <>
      <div>
        <div className="mx-6 border-b-[0.5px] border-custom-border-200 grid grid-cols-6 gap-1 text-xs text-custom-text-300 pb-1">
          <h6 className="col-span-4 pl-1 flex items-center gap-1">
            Issues{" "}
            <span className="flex-shrink-0 bg-custom-primary-100/20 text-custom-primary-100 text-xs font-medium py-1 px-1.5 rounded-xl h-4 min-w-6 flex items-center text-center justify-center">
              {totalIssues}
            </span>
          </h6>
          <h6>Due date</h6>
          <h6>Blocked by</h6>
        </div>
        <div className="px-4 mt-2">
          {issues.map((issue) => (
            <Link
              key={issue.id}
              href={`/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`}
              className="block py-2 px-3 hover:bg-custom-background-80 rounded"
            >
              <PriorityDropdown
                value={issue.priority}
                onChange={() => {}}
                buttonVariant="border-without-text"
                buttonClassName="border"
              />
            </Link>
          ))}
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
