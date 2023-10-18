import { FC } from "react";
// components
import { KanBanProperties } from "./properties";
import { IssuePeekOverview } from "components/issues/issue-peek-overview";
// ui
import { Tooltip } from "@plane/ui";

interface IssueBlockProps {
  columnId: string;
  issues: any;
  handleIssues?: (group_by: string | null, issue: any) => void;
  display_properties: any;
  states: any;
  labels: any;
  members: any;
  priorities: any;
}

export const IssueBlock: FC<IssueBlockProps> = (props) => {
  const { columnId, issues, handleIssues, display_properties, states, labels, members, priorities } = props;

  const handleIssue = (_issue: any) => {
    if (_issue && handleIssues) handleIssues(!columnId && columnId === "null" ? null : columnId, _issue);
  };

  return (
    <>
      {issues &&
        issues?.length > 0 &&
        issues.map((issue: any, index: any) => (
          <div
            key={index}
            className={`text-sm p-3 shadow-custom-shadow-2xs bg-custom-background-100 flex items-center gap-3 border-b border-custom-border-200 hover:bg-custom-background-80`}
          >
            {display_properties && display_properties?.key && (
              <div className="flex-shrink-0 text-xs text-custom-text-300">
                {issue?.project_detail?.identifier}-{issue.sequence_id}
              </div>
            )}

            <IssuePeekOverview
              workspaceSlug={issue?.workspace_detail?.slug}
              projectId={issue?.project_detail?.id}
              issueId={issue?.id}
              handleIssue={handleIssue}
            >
              <Tooltip tooltipHeading="Title" tooltipContent={issue.name}>
                <div className="line-clamp-1 text-sm font-medium text-custom-text-100 w-full">{issue.name}</div>
              </Tooltip>
            </IssuePeekOverview>

            <div className="ml-auto flex-shrink-0">
              <KanBanProperties
                columnId={columnId}
                issue={issue}
                handleIssues={handleIssues}
                display_properties={display_properties}
                states={states}
                labels={labels}
                members={members}
                priorities={priorities}
              />
            </div>
          </div>
        ))}
    </>
  );
};
