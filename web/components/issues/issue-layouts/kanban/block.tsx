import { Draggable } from "@hello-pangea/dnd";
// components
import { KanBanProperties } from "./properties";
// types
import { IEstimatePoint, IIssue, IIssueDisplayProperties, IIssueLabels, IState, IUserLite } from "types";

interface IssueBlockProps {
  sub_group_id: string;
  columnId: string;
  index: number;
  issue: IIssue;
  isDragDisabled: boolean;
  handleIssues: (
    sub_group_by: string | null,
    group_by: string | null,
    issue: IIssue,
    action: "update" | "delete"
  ) => void;
  quickActions: (sub_group_by: string | null, group_by: string | null, issue: IIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties;
  states: IState[] | null;
  labels: IIssueLabels[] | null;
  members: IUserLite[] | null;
  estimates: IEstimatePoint[] | null;
}

export const KanbanIssueBlock: React.FC<IssueBlockProps> = (props) => {
  const {
    sub_group_id,
    columnId,
    index,
    issue,
    isDragDisabled,
    handleIssues,
    quickActions,
    displayProperties,
    states,
    labels,
    members,
    estimates,
  } = props;

  const updateIssue = (sub_group_by: string | null, group_by: string | null, issueToUpdate: IIssue) => {
    if (issueToUpdate) handleIssues(sub_group_by, group_by, issueToUpdate, "update");
  };

  return (
    <>
      <Draggable draggableId={issue.id} index={index} isDragDisabled={isDragDisabled}>
        {(provided, snapshot) => (
          <div
            className="group/kanban-block relative p-1.5 hover:cursor-default"
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            ref={provided.innerRef}
          >
            {issue.tempId !== undefined && (
              <div className="absolute top-0 left-0 w-full h-full animate-pulse bg-custom-background-100/20 z-[99999]" />
            )}
            <div className="absolute top-3 right-3 hidden group-hover/kanban-block:block">
              {quickActions(
                !sub_group_id && sub_group_id === "null" ? null : sub_group_id,
                !columnId && columnId === "null" ? null : columnId,
                issue
              )}
            </div>
            <div
              className={`text-sm rounded p-2 px-3 shadow-custom-shadow-2xs space-y-[8px] border transition-all bg-custom-background-100 hover:cursor-grab ${
                snapshot.isDragging ? `border-custom-primary-100` : `border-transparent`
              }`}
            >
              {displayProperties && displayProperties?.key && (
                <div className="text-xs line-clamp-1 text-custom-text-300">
                  {issue.project_detail.identifier}-{issue.sequence_id}
                </div>
              )}
              <div className="line-clamp-2 text-sm font-medium text-custom-text-100">{issue.name}</div>
              <div>
                <KanBanProperties
                  sub_group_id={sub_group_id}
                  columnId={columnId}
                  issue={issue}
                  handleIssues={updateIssue}
                  displayProperties={displayProperties}
                  states={states}
                  labels={labels}
                  members={members}
                  estimates={estimates}
                />
              </div>
            </div>
          </div>
        )}
      </Draggable>
    </>
  );
};
