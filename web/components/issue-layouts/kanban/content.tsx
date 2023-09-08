// react beautiful dnd
import { Draggable } from "react-beautiful-dnd";

interface IssueContentProps {
  columnId: string;
  issues: any;
}

export const IssueContent = ({ columnId, issues }: IssueContentProps) => {
  console.log();

  return (
    <>
      {issues && issues.length > 0 ? (
        <>
          {issues.map((issue: any, index: any) => (
            <Draggable
              draggableId={issue.id}
              index={index}
              key={`issue-blocks-${columnId}-${issue.id}`}
            >
              {(provided: any, snapshot: any) => (
                <div
                  key={issue.id}
                  className="p-1.5 hover:cursor-default"
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  ref={provided.innerRef}
                >
                  <div
                    className={`min-h-[106px] text-sm rounded p-2 px-3 shadow-md space-y-[4px] border transition-all hover:cursor-grab ${
                      snapshot.isDragging
                        ? `border-blue-500 bg-blue-50`
                        : `border-transparent bg-white`
                    }`}
                  >
                    <div className="text-xs line-clamp-1 text-gray-500">
                      ONE-{issue.sequence_id}-{issue.sort_order}
                    </div>
                    <div className="line-clamp-2 h-[40px] text-sm font-medium">{issue.name}</div>
                    <div className="h-[22px]">Footer</div>
                  </div>
                </div>
              )}
            </Draggable>
          ))}
        </>
      ) : (
        <div>No issues are available.</div>
      )}
    </>
  );
};
