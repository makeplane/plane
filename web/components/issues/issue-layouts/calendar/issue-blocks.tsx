import { observer } from "mobx-react-lite";
import { Draggable } from "@hello-pangea/dnd";
// components
import { CalendarIssueBlock } from "components/issues";
// types
import { TIssue, TIssueMap } from "@plane/types";

type Props = {
  issues: TIssueMap | undefined;
  issueIdList: string[] | null;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  showAllIssues?: boolean;
  isDragDisabled?: boolean;
};

export const CalendarIssueBlocks: React.FC<Props> = observer((props) => {
  const { issues, issueIdList, quickActions, showAllIssues = false, isDragDisabled = false } = props;
  return (
    <>
      {issueIdList?.slice(0, showAllIssues ? issueIdList.length : 4).map((issueId, index) => {
        if (!issues?.[issueId]) return null;
        const issue = issues?.[issueId];
        return (
          <Draggable key={issue.id} draggableId={issue.id} index={index} isDragDisabled={isDragDisabled}>
            {(provided, snapshot) => (
              <div
                className="relative cursor-pointer p-1 px-2"
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                ref={provided.innerRef}
              >
                <CalendarIssueBlock isDragging={snapshot.isDragging} issue={issue} quickActions={quickActions} />
              </div>
            )}
          </Draggable>
        );
      })}
    </>
  );
});
