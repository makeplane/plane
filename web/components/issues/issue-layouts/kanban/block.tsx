// react beautiful dnd
import { Draggable } from "@hello-pangea/dnd";
// components
import { KanBanProperties } from "./properties";

interface IssueBlockProps {
  sub_group_id: string;
  columnId: string;
  issues: any;
  isDragDisabled: boolean;
}

export const IssueBlock = ({ sub_group_id, columnId, issues, isDragDisabled }: IssueBlockProps) => (
  <>
    {issues && issues.length > 0 ? (
      <>
        {issues.map((issue: any, index: any) => (
          <Draggable
            key={`issue-blocks-${sub_group_id}-${columnId}-${issue.id}`}
            draggableId={`${issue.id}`}
            index={index}
            isDragDisabled={isDragDisabled}
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
                  className={`min-h-[106px] text-sm rounded p-2 px-3 shadow-custom-shadow-2xs space-y-[8px] border transition-all bg-custom-background-100 hover:cursor-grab ${
                    snapshot.isDragging ? `border-custom-primary-100` : `border-transparent`
                  }`}
                >
                  <div className="text-xs line-clamp-1 text-custom-text-300">ONE-{issue.sequence_id}</div>
                  <div className="line-clamp-2 h-[40px] text-sm font-medium text-custom-text-100">{issue.name}</div>
                  <div className="min-h-[22px]">
                    <KanBanProperties />
                  </div>
                </div>
              </div>
            )}
          </Draggable>
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
