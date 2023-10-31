// components
import { KanbanIssueBlock } from "components/issues";
import { IIssueDisplayProperties, IIssue } from "types";

interface IssueBlocksListProps {
  sub_group_id: string;
  columnId: string;
  issues: IIssue[];
  isDragDisabled: boolean;
  handleIssues: (
    sub_group_by: string | null,
    group_by: string | null,
    issue: IIssue,
    action: "update" | "delete"
  ) => void;
  quickActions: (sub_group_by: string | null, group_by: string | null, issue: IIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties;
}

export const KanbanIssueBlocksList: React.FC<IssueBlocksListProps> = (props) => {
  const { sub_group_id, columnId, issues, isDragDisabled, handleIssues, quickActions, displayProperties } = props;

  return (
    <>
      {issues && issues.length > 0 ? (
        <>
          {issues.map((issue, index) => (
            <KanbanIssueBlock
              key={`kanban-issue-block-${issue.id}`}
              index={index}
              issue={issue}
              handleIssues={handleIssues}
              quickActions={quickActions}
              displayProperties={displayProperties}
              columnId={columnId}
              sub_group_id={sub_group_id}
              isDragDisabled={isDragDisabled}
            />
          ))}
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
