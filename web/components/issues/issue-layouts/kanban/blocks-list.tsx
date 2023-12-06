// components
import { KanbanIssueBlock } from "components/issues";
import { IIssueDisplayProperties, IIssue } from "types";
import { EIssueActions } from "../types";
import { IIssueResponse } from "store/issues/types";

interface IssueBlocksListProps {
  sub_group_id: string;
  columnId: string;
  issues: IIssueResponse;
  issueIds: string[];
  isDragDisabled: boolean;
  showEmptyGroup: boolean;
  handleIssues: (sub_group_by: string | null, group_by: string | null, issue: IIssue, action: EIssueActions) => void;
  quickActions: (
    sub_group_by: string | null,
    group_by: string | null,
    issue: IIssue,
    customActionButton?: React.ReactElement
  ) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | null;
  isReadOnly: boolean;
}

export const KanbanIssueBlocksList: React.FC<IssueBlocksListProps> = (props) => {
  const {
    sub_group_id,
    columnId,
    issues,
    issueIds,
    showEmptyGroup,
    isDragDisabled,
    handleIssues,
    quickActions,
    displayProperties,
    isReadOnly,
  } = props;

  return (
    <>
      {issueIds && issueIds.length > 0 ? (
        <>
          {issueIds.map((issueId, index) => {
            if (!issues[issueId]) return null;

            const issue = issues[issueId];

            return (
              <KanbanIssueBlock
                key={`kanban-issue-block-${issue.id}`}
                index={index}
                issue={issue}
                showEmptyGroup={showEmptyGroup}
                handleIssues={handleIssues}
                quickActions={quickActions}
                displayProperties={displayProperties}
                columnId={columnId}
                sub_group_id={sub_group_id}
                isDragDisabled={isDragDisabled}
                isReadOnly={isReadOnly}
              />
            );
          })}
        </>
      ) : (
        !isDragDisabled && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            {/* <div className="text-custom-text-300 text-sm">Drop here</div> */}
          </div>
        )
      )}
    </>
  );
};
