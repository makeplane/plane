import { FC } from "react";
// components
import { IssueBlock } from "components/issues";
// types
import { IIssue, IIssueDisplayProperties } from "types";
import { IIssueResponse, IGroupedIssues, TUnGroupedIssues } from "store/issues/types";
import { EIssueActions } from "../types";

interface Props {
  columnId: string;
  issueIds: IGroupedIssues | TUnGroupedIssues | any;
  issues: IIssueResponse;
  canEditProperties: (projectId: string | undefined) => boolean;
  handleIssues: (issue: IIssue, action: EIssueActions) => void;
  quickActions: (group_by: string | null, issue: IIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | undefined;
}

export const IssueBlocksList: FC<Props> = (props) => {
  const { columnId, issueIds, issues, handleIssues, quickActions, displayProperties, canEditProperties } = props;

  return (
    <div className="relative h-full w-full divide-y-[0.5px] divide-custom-border-200">
      {issueIds && issueIds.length > 0 ? (
        issueIds.map(
          (issueId: string) =>
            issueId != undefined &&
            issues[issueId] && (
              <IssueBlock
                key={issues[issueId].id}
                columnId={columnId}
                issue={issues[issueId]}
                handleIssues={handleIssues}
                quickActions={quickActions}
                canEditProperties={canEditProperties}
                displayProperties={displayProperties}
              />
            )
        )
      ) : (
        <div className="bg-custom-background-100 p-3 text-sm text-custom-text-400">No issues</div>
      )}
    </div>
  );
};
