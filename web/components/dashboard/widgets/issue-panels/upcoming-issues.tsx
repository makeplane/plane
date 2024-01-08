import Link from "next/link";
import { observer } from "mobx-react-lite";
// hooks
import { useProject } from "hooks/store";
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

type IssueListItemProps = {
  issue: IWidgetIssue;
  workspaceSlug: string;
};

const IssueListItem: React.FC<IssueListItemProps> = observer((props) => {
  const { issue, workspaceSlug } = props;
  // store hooks
  const { getProjectById } = useProject();

  const blockedByIssues = issue.related_issues?.filter((issue) => issue.relation_type === "blocked_by");
  const projectDetails = getProjectById(issue.project);

  return (
    <Link
      href={`/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`}
      className="block py-2 px-3 hover:bg-custom-background-80 rounded"
    >
      <div className="flex items-center gap-3">
        <PriorityDropdown
          value={issue.priority}
          // TODO: handle update priority
          onChange={() => {}}
          buttonVariant="border-without-text"
          buttonClassName="border"
          className="flex-shrink-0"
        />
        <span className="text-xs font-medium flex-shrink-0">
          {projectDetails?.identifier} {issue.sequence_id}
        </span>
        <h6 className="text-sm flex-grow truncate">{issue.name}</h6>
      </div>
    </Link>
  );
});

export const UpcomingIssuesPanel: React.FC<Props> = (props) => {
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
            <IssueListItem key={issue.id} issue={issue} workspaceSlug={workspaceSlug} />
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
