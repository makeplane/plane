import { memo } from "react";
//types
import { TIssue, IIssueDisplayProperties, IIssueMap } from "@plane/types";
import { EIssueActions } from "../types";
// components
import { KanbanIssueBlock } from "components/issues";

interface IssueBlocksListProps {
  sub_group_id: string;
  columnId: string;
  issuesMap: IIssueMap;
  peekIssueId?: string;
  issueIds: string[];
  displayProperties: IIssueDisplayProperties | undefined;
  isDragDisabled: boolean;
  handleIssues: (issue: TIssue, action: EIssueActions) => void;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  canEditProperties: (projectId: string | undefined) => boolean;
}

const KanbanIssueBlocksListMemo: React.FC<IssueBlocksListProps> = (props) => {
  const {
    sub_group_id,
    columnId,
    issuesMap,
    peekIssueId,
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
              <KanbanIssueBlock
                key={draggableId}
                peekIssueId={peekIssueId}
                issueId={issueId}
                issuesMap={issuesMap}
                displayProperties={displayProperties}
                handleIssues={handleIssues}
                quickActions={quickActions}
                draggableId={draggableId}
                index={index}
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
