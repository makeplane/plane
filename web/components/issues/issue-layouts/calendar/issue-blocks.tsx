import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Placement } from "@popperjs/core";
import { observer } from "mobx-react-lite";
import { TIssue, TIssueMap } from "@plane/types";
// components
import { CalendarQuickAddIssueForm, CalendarIssueBlockRoot } from "@/components/issues";
// helpers
import { renderFormattedPayloadDate } from "@/helpers/date-time.helper";
// types

type Props = {
  date: Date;
  issues: TIssueMap | undefined;
  issueIdList: string[] | null;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement, placement?: Placement) => React.ReactNode;
  isDragDisabled?: boolean;
  enableQuickIssueCreate?: boolean;
  disableIssueCreation?: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  viewId?: string;
  readOnly?: boolean;
  isMobileView?: boolean;
};

export const CalendarIssueBlocks: React.FC<Props> = observer((props) => {
  const {
    date,
    issues,
    issueIdList,
    quickActions,
    isDragDisabled = false,
    enableQuickIssueCreate,
    disableIssueCreation,
    quickAddCallback,
    addIssuesToView,
    viewId,
    readOnly,
    isMobileView = false,
  } = props;
  // states
  const [showAllIssues, setShowAllIssues] = useState(false);

  const formattedDatePayload = renderFormattedPayloadDate(date);
  const totalIssues = issueIdList?.length ?? 0;

  if (!formattedDatePayload) return null;

  return (
    <>
      {issueIdList?.slice(0, showAllIssues || isMobileView ? issueIdList.length : 4).map((issueId, index) =>
        !isMobileView ? (
          <Draggable key={issueId} draggableId={issueId} index={index} isDragDisabled={isDragDisabled}>
            {(provided, snapshot) => (
              <div
                className="relative cursor-pointer p-1 px-2"
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                ref={provided.innerRef}
              >
                <CalendarIssueBlockRoot
                  issues={issues}
                  issueId={issueId}
                  quickActions={quickActions}
                  isDragging={snapshot.isDragging}
                />
              </div>
            )}
          </Draggable>
        ) : (
          <CalendarIssueBlockRoot key={issueId} issues={issues} issueId={issueId} quickActions={quickActions} />
        )
      )}

      {enableQuickIssueCreate && !disableIssueCreation && !readOnly && (
        <div className="px-1 md:px-2 py-1 border-custom-border-200 border-b md:border-none">
          <CalendarQuickAddIssueForm
            formKey="target_date"
            groupId={formattedDatePayload}
            prePopulatedData={{
              target_date: formattedDatePayload,
            }}
            quickAddCallback={quickAddCallback}
            addIssuesToView={addIssuesToView}
            viewId={viewId}
            onOpen={() => setShowAllIssues(true)}
          />
        </div>
      )}
      {totalIssues > 4 && (
        <div className="hidden md:flex items-center px-2.5 py-1">
          <button
            type="button"
            className="w-min whitespace-nowrap rounded text-xs px-1.5 py-1 text-custom-text-400 font-medium  hover:bg-custom-background-80 hover:text-custom-text-300"
            onClick={() => setShowAllIssues(!showAllIssues)}
          >
            {showAllIssues ? "Hide" : totalIssues - 4 + " more"}
          </button>
        </div>
      )}
    </>
  );
});
