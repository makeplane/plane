import { FC } from "react";
// components
import { IssueBlock } from "components/issues";
// types
import { IIssue, IIssueDisplayProperties } from "types";

interface Props {
  columnId: string;
  issues: IIssue[];
  isReadonly?: boolean;
  handleIssues: (group_by: string | null, issue: IIssue, action: "update" | "delete") => void;
  quickActions: (group_by: string | null, issue: IIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties;
  showEmptyGroup?: boolean;
}

export const IssueBlocksList: FC<Props> = (props) => {
  const { columnId, issues, handleIssues, quickActions, displayProperties, showEmptyGroup, isReadonly } = props;

  return (
    <div className="w-full h-full relative divide-y-[0.5px] divide-custom-border-200">
      {issues && issues.length > 0 ? (
        issues.map((issue) => (
          <IssueBlock
            key={issue.id}
            columnId={columnId}
            issue={issue}
            handleIssues={handleIssues}
            quickActions={quickActions}
            isReadonly={isReadonly}
            displayProperties={displayProperties}
            showEmptyGroup={showEmptyGroup}
          />
        ))
      ) : (
        <div className="bg-custom-background-100 text-custom-text-400 text-sm p-3">No issues</div>
      )}
    </div>
  );
};
