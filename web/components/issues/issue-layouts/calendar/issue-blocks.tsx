import { Draggable } from "@hello-pangea/dnd";
// types
import { IIssue } from "types";

type Props = { issues: IIssue[] | null };

export const CalendarIssueBlocks: React.FC<Props> = (props) => {
  const { issues } = props;

  return (
    <div className="space-y-2">
      {issues?.map((issue, index) => (
        <Draggable key={issue.id} draggableId={issue.id} index={index}>
          {(provided, snapshot) => (
            <div
              className={`h-8 w-full shadow-custom-shadow-2xs rounded py-1.5 px-1 flex items-center gap-1.5 border-[0.5px] border-custom-border-200 ${
                snapshot.isDragging ? "shadow-custom-shadow-rg bg-custom-background-90" : "bg-custom-background-100"
              }`}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              ref={provided.innerRef}
            >
              <span
                className="h-full w-0.5 rounded flex-shrink-0"
                style={{
                  backgroundColor: issue.state_detail.color,
                }}
              />
              <div className="text-xs text-custom-text-300 flex-shrink-0">
                {issue.project_detail.identifier}-{issue.sequence_id}
              </div>
              <h6 className="text-xs flex-grow truncate">{issue.name}</h6>
            </div>
          )}
        </Draggable>
      ))}
    </div>
  );
};
