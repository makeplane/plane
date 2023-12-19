import { memo } from "react";
//types
import { IIssue, IIssueDisplayProperties, IIssueMap } from "types";
import { EIssueActions } from "../types";
// components
import { KanbanIssueBlock } from "components/issues";

interface IssueBlocksListProps {
  sub_group_id: string;
  columnId: string;
  issuesMap: IIssueMap;
  issueIds: string[];
  displayProperties: IIssueDisplayProperties;
  isDragDisabled: boolean;
  handleIssues: (issue: IIssue, action: EIssueActions) => void;
  quickActions: (issue: IIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  canEditProperties: (projectId: string | undefined) => boolean;
}

const KanbanIssueBlocksListMemo: React.FC<IssueBlocksListProps> = (props) => {
  const {
    sub_group_id,
    columnId,
    issuesMap,
    issueIds,
    displayProperties,
    isDragDisabled,
    handleIssues,
    quickActions,
    canEditProperties,
  } = props;

  return (
    <>
      {issueIds && issueIds.length > 0 ? (
        <>
          {issueIds.map((issueId, index) => {
            if (!issueId) return null;

            return (
              <KanbanIssueBlock
                key={`kanban-issue-block-${issueId}`}
                index={index}
                issueId={issueId}
                issuesMap={issuesMap}
                displayProperties={displayProperties}
                handleIssues={handleIssues}
                quickActions={quickActions}
                columnId={columnId}
                sub_group_id={sub_group_id}
                isDragDisabled={isDragDisabled}
                canEditProperties={canEditProperties}
              />
            );
          })}
        </>
      ) : null}
    </>
  );
};

export const KanbanIssueBlocksList = memo(KanbanIssueBlocksListMemo);
