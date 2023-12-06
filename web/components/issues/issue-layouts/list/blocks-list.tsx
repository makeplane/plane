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
  isReadonly?: boolean;
  handleIssues: (issue: IIssue, action: EIssueActions) => void;
  quickActions: (group_by: string | null, issue: IIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | undefined;
}

export const IssueBlocksList: FC<Props> = (props) => {
  const { columnId, issueIds, issues, handleIssues, quickActions, displayProperties, isReadonly } = props;

  return (
    <div className="w-full h-full relative divide-y-[0.5px] divide-custom-border-200">
      {issueIds && issueIds.length > 0 ? (
        issueIds.map((issueId: string) => (
          <IssueBlock
            key={issues[issueId]?.id}
            columnId={columnId}
            issue={issues[issueId]}
            handleIssues={handleIssues}
            quickActions={quickActions}
            isReadonly={isReadonly}
            displayProperties={displayProperties}
          />
        ))
      ) : (
        <div className="bg-custom-background-100 text-custom-text-400 text-sm p-3">No issues</div>
      )}
    </div>
  );
};
