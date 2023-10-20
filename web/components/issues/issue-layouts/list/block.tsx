// components
import { KanBanProperties } from "./properties";
import { IssuePeekOverview } from "components/issues/issue-peek-overview";
import { IssueQuickActions } from "components/issues";
// ui
import { Tooltip } from "@plane/ui";
// types
import { IIssue } from "types";

interface IssueBlockProps {
  columnId: string;
  issue: IIssue;
  handleIssues: (group_by: string | null, issue: IIssue, action: "update" | "delete") => void;
  display_properties: any;
  states: any;
  labels: any;
  members: any;
  priorities: any;
}

export const IssueBlock: React.FC<IssueBlockProps> = (props) => {
  const { columnId, issue, handleIssues, display_properties, states, labels, members, priorities } = props;

  const updateIssue = (_issue: IIssue) => {
    if (_issue && handleIssues) handleIssues(!columnId && columnId === "null" ? null : columnId, _issue, "update");
  };

  return (
    <>
      <div className="text-sm p-3 shadow-custom-shadow-2xs bg-custom-background-100 flex items-center gap-3 border-b border-custom-border-200 hover:bg-custom-background-80">
        {display_properties && display_properties?.key && (
          <div className="flex-shrink-0 text-xs text-custom-text-300">
            {issue?.project_detail?.identifier}-{issue.sequence_id}
          </div>
        )}
        <IssuePeekOverview
          workspaceSlug={issue?.workspace_detail?.slug}
          projectId={issue?.project_detail?.id}
          issueId={issue?.id}
          // TODO: add the logic here
          handleIssue={() => {}}
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
            states={states}
            labels={labels}
            members={members}
            priorities={priorities}
          />
          <IssueQuickActions
            issue={issue}
            handleDelete={async () => handleIssues(!columnId && columnId === "null" ? null : columnId, issue, "delete")}
            handleUpdate={async (data) =>
              handleIssues(!columnId && columnId === "null" ? null : columnId, data, "update")
            }
          />
        </div>
      </div>
    </>
  );
};
