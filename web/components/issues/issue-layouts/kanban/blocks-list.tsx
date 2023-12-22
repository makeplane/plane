import { memo } from "react";
//types
import { IIssue, IIssueDisplayProperties, IIssueMap } from "types";
import { EIssueActions } from "../types";
// components
import { KanbanIssueBlock } from "components/issues";
import { Draggable } from "@hello-pangea/dnd";

interface IssueBlocksListProps {
  sub_group_id: string;
  columnId: string;
  issuesMap: IIssueMap;
  issueIds: string[];
  displayProperties: IIssueDisplayProperties | undefined;
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

            let draggableId = issueId;
            if (columnId) draggableId = `${draggableId}__${columnId}`;
            if (sub_group_id) draggableId = `${draggableId}__${sub_group_id}`;

            return (
              <Draggable key={draggableId} draggableId={draggableId} index={index}>
                {(provided, snapshot) => (
                  <KanbanIssueBlock
                    key={`kanban-issue-block-${issueId}`}
                    issueId={issueId}
                    issuesMap={issuesMap}
                    displayProperties={displayProperties}
                    handleIssues={handleIssues}
                    quickActions={quickActions}
                    provided={provided}
                    snapshot={snapshot}
                    isDragDisabled={isDragDisabled}
                    canEditProperties={canEditProperties}
                  />
                )}
              </Draggable>
            );
          })}
        </>
      ) : null}
    </>
  );
};

export const KanbanIssueBlocksList = memo(KanbanIssueBlocksListMemo);
