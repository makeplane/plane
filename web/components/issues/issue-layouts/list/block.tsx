import { useRouter } from "next/router";
// components
import { ListProperties } from "./properties";
// ui
import { Spinner, Tooltip } from "@plane/ui";
// types
import { IIssue, IIssueDisplayProperties } from "types";
import { EIssueActions } from "../types";

interface IssueBlockProps {
  columnId: string;

  issue: IIssue;
  handleIssues: (issue: IIssue, action: EIssueActions) => void;
  quickActions: (group_by: string | null, issue: IIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | undefined;
  canEditProperties: (projectId: string | undefined) => boolean;
}

export const IssueBlock: React.FC<IssueBlockProps> = (props) => {
  const { columnId, issue, handleIssues, quickActions, displayProperties, canEditProperties } = props;
  // router
  const router = useRouter();
  const updateIssue = (group_by: string | null, issueToUpdate: IIssue) => {
    handleIssues(issueToUpdate, EIssueActions.UPDATE);
  };

  const handleIssuePeekOverview = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const { query } = router;
    if (event.ctrlKey || event.metaKey) {
      const issueUrl = `/${issue.workspace_detail.slug}/projects/${issue.project_detail.id}/issues/${issue?.id}`;
      window.open(issueUrl, "_blank"); // Open link in a new tab
    } else {
      router.push({
        pathname: router.pathname,
        query: { ...query, peekIssueId: issue?.id, peekProjectId: issue?.project },
      });
    }
  };

  const canEditIssueProperties = canEditProperties(issue.project);

  return (
    <>
      <button
        className="relative flex items-center gap-3 bg-custom-background-100 p-3 text-sm w-full"
        onClick={handleIssuePeekOverview}
      >
        {displayProperties && displayProperties?.key && (
          <div className="flex-shrink-0 text-xs font-medium text-custom-text-300">
            {issue?.project_detail?.identifier}-{issue.sequence_id}
          </div>
        )}

        {issue?.tempId !== undefined && (
          <div className="absolute left-0 top-0 z-[99999] h-full w-full animate-pulse bg-custom-background-100/20" />
        )}
        <Tooltip tooltipHeading="Title" tooltipContent={issue.name}>
          <div className="line-clamp-1 w-full cursor-pointer text-sm font-medium text-custom-text-100 text-left">
            {issue.name}
          </div>
        </Tooltip>

        <div className="ml-auto flex flex-shrink-0 items-center gap-2">
          {!issue?.tempId ? (
            <>
              <ListProperties
                columnId={columnId}
                issue={issue}
                isReadonly={!canEditIssueProperties}
                handleIssues={updateIssue}
                displayProperties={displayProperties}
              />
              {quickActions(!columnId && columnId === "null" ? null : columnId, issue)}
            </>
          ) : (
            <div className="h-4 w-4">
              <Spinner className="h-4 w-4" />
            </div>
          )}
        </div>
      </button>
    </>
  );
};
