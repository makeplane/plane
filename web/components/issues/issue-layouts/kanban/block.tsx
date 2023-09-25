// react beautiful dnd
import { Draggable } from "@hello-pangea/dnd";

interface IssueBlockProps {
  sub_group_id: string;
  columnId: string;
  issues: any;
}

export const IssueBlock = ({ sub_group_id, columnId, issues }: IssueBlockProps) => {
  console.log();

  return (
    <>
      {issues && issues.length > 0 ? (
        <>
          {issues.map((issue: any, index: any) => (
            <Draggable
              draggableId={`${sub_group_id}-${columnId}-${issue.id}`}
              index={index}
              key={`issue-blocks-${sub_group_id}-${columnId}-${issue.id}`}
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
                    className={`min-h-[106px] text-sm rounded p-2 px-3 shadow-custom-shadow-2xs space-y-[4px] border transition-all bg-custom-background-100 hover:cursor-grab ${
                      snapshot.isDragging ? `border-custom-primary-100` : `border-transparent`
                    }`}
                  >
                    <div className="text-xs line-clamp-1 text-custom-text-300">ONE-{issue.sequence_id}</div>
                    <div className="line-clamp-2 h-[40px] text-sm font-medium text-custom-text-100">{issue.name}</div>
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
