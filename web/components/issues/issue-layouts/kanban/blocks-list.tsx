// components
import { KanbanIssueBlock } from "components/issues";
import { IEstimatePoint, IIssue, IIssueLabels, IState, IUserLite } from "types";

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
  display_properties: any;
  states: IState[] | null;
  labels: IIssueLabels[] | null;
  members: IUserLite[] | null;
  estimates: IEstimatePoint[] | null;
}

export const KanbanIssueBlocksList: React.FC<IssueBlocksListProps> = (props) => {
  const {
    sub_group_id,
    columnId,
    issues,
    isDragDisabled,
    handleIssues,
    quickActions,
    display_properties,
    states,
    labels,
    members,
    estimates,
  } = props;

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
              displayProperties={display_properties}
              columnId={columnId}
              sub_group_id={sub_group_id}
              isDragDisabled={isDragDisabled}
              states={states}
              labels={labels}
              members={members}
              estimates={estimates}
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
