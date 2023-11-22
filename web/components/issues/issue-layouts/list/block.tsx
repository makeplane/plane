// components
import { ListProperties } from "./properties";
import { IssuePeekOverview } from "components/issues/issue-peek-overview";
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
  isReadonly?: boolean;
}

export const IssueBlock: React.FC<IssueBlockProps> = (props) => {
  const { columnId, issue, handleIssues, quickActions, displayProperties, isReadonly } = props;

  const updateIssue = (group_by: string | null, issueToUpdate: IIssue) => {
    handleIssues(issueToUpdate, EIssueActions.UPDATE);
  };

  return (
    <>
      <div className="text-sm p-3 relative bg-custom-background-100 flex items-center gap-3">
        {displayProperties && displayProperties?.key && (
          <div className="flex-shrink-0 text-xs text-custom-text-300 font-medium">
            {issue?.project_detail?.identifier}-{issue.sequence_id}
          </div>
        )}

        {issue?.tempId !== undefined && (
          <div className="absolute top-0 left-0 w-full h-full animate-pulse bg-custom-background-100/20 z-[99999]" />
        )}

        <IssuePeekOverview
          workspaceSlug={issue?.workspace_detail?.slug}
          projectId={issue?.project_detail?.id}
          issueId={issue?.id}
          isArchived={issue?.archived_at !== null}
          handleIssue={(issueToUpdate) => {
            handleIssues(issueToUpdate as IIssue, EIssueActions.UPDATE);
          }}
        >
          <Tooltip tooltipHeading="Title" tooltipContent={issue.name}>
            <div className="line-clamp-1 text-sm font-medium text-custom-text-100 w-full">{issue.name}</div>
          </Tooltip>
        </IssuePeekOverview>

        <div className="ml-auto flex-shrink-0 flex items-center gap-2">
          {!issue?.tempId ? (
            <>
              <ListProperties
                columnId={columnId}
                issue={issue}
                isReadonly={isReadonly}
                handleIssues={updateIssue}
                displayProperties={displayProperties}
              />
              {quickActions(!columnId && columnId === "null" ? null : columnId, issue)}
            </>
          ) : (
            <div className="w-4 h-4">
              <Spinner className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
