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
                  className="p-2"
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  ref={provided.innerRef}
                >
                  <div
                    className={`text-sm rounded p-2 px-3 bg-white shadow space-y-1 border border-transparent`}
                  >
                    <div className="text-xs line-clamp-1 text-gray-500 font-medium">
                      ONE-{issue.sequence_id}-{issue.sort_order}
                    </div>
                    <div className="line-clamp-2 h-[42px]">
                      {issue.name} {issue.name} {issue.name} {issue.name} {issue.name} {issue.name}{" "}
                      {issue.name} {issue.name}
                    </div>
                    <div>Footer</div>
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
