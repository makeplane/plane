// components
import { KanBanProperties } from "./properties";
import { IssuePeekOverview } from "components/issues/issue-peek-overview";
// ui
import { Tooltip } from "@plane/ui";
// types
import { IIssue } from "types";

interface IssueBlockProps {
  columnId: string;
  issue: IIssue;
  handleIssues: (group_by: string | null, issue: IIssue, action: "update" | "delete") => void;
  quickActions: (group_by: string | null, issue: IIssue) => React.ReactNode;
  display_properties: any;
  showEmptyGroup?: boolean;
}

export const IssueBlock: React.FC<IssueBlockProps> = (props) => {
  const { columnId, issue, handleIssues, quickActions, display_properties, showEmptyGroup } = props;

  const updateIssue = (group_by: string | null, issueToUpdate: IIssue) => {
    handleIssues(group_by, issueToUpdate, "update");
  };

  return (
    <>
      <div className="text-sm p-3 relative bg-custom-background-100 flex items-center gap-3">
        {display_properties && display_properties?.key && (
          <div className="flex-shrink-0 text-xs text-custom-text-300">
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
          handleIssue={(issueToUpdate) => {
            handleIssues(!columnId && columnId === "null" ? null : columnId, issueToUpdate as IIssue, "update");
          }}
        >
          <Tooltip tooltipHeading="Title" tooltipContent={issue.name}>
            <div className="line-clamp-1 text-sm font-medium text-custom-text-100 w-full">{issue.name}</div>
          </Tooltip>
        </IssuePeekOverview>

        <div className="ml-auto flex-shrink-0 flex items-center gap-2">
          <KanBanProperties
            columnId={columnId}
            issue={issue}
            handleIssues={updateIssue}
            display_properties={display_properties}
            showEmptyGroup={showEmptyGroup}
          />
          {quickActions(!columnId && columnId === "null" ? null : columnId, issue)}
        </div>
      </div>
    </>
  );
};
