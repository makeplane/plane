import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Droppable } from "@hello-pangea/dnd";
// components
import { CalendarIssueBlocks, ICalendarDate, CalendarQuickAddIssueForm } from "components/issues";
// helpers
import { renderDateFormat } from "helpers/date-time.helper";
// constants
import { MONTHS_LIST } from "constants/calendar";
import { IIssue } from "types";
import { IGroupedIssues, IIssueResponse } from "store/issues/types";
import {
  ICycleIssuesFilterStore,
  IModuleIssuesFilterStore,
  IProjectIssuesFilterStore,
  IViewIssuesFilterStore,
} from "store/issues";

type Props = {
  issuesFilterStore:
    | IProjectIssuesFilterStore
    | IModuleIssuesFilterStore
    | ICycleIssuesFilterStore
    | IViewIssuesFilterStore;
  date: ICalendarDate;
  issues: IIssueResponse | undefined;
  groupedIssueIds: IGroupedIssues;
  quickActions: (issue: IIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  enableQuickIssueCreate?: boolean;
  disableIssueCreation?: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: IIssue,
    viewId?: string
  ) => Promise<IIssue | undefined>;
  viewId?: string;
};

export const CalendarDayTile: React.FC<Props> = observer((props) => {
  const {
    issuesFilterStore,
    date,
    issues,
    groupedIssueIds,
    quickActions,
    enableQuickIssueCreate,
    disableIssueCreation,
    quickAddCallback,
    viewId,
  } = props;
  const [showAllIssues, setShowAllIssues] = useState(false);
  const calendarLayout = issuesFilterStore?.issueFilters?.displayFilters?.calendar?.layout ?? "month";

  const issueIdList = groupedIssueIds ? groupedIssueIds[renderDateFormat(date.date)] : null;

  const totalIssues = issueIdList?.length ?? 0;
  return (
    <>
      <div className="group relative flex h-full w-full flex-col bg-custom-background-90">
        {/* header */}
        <div
          className={`flex-shrink-0 px-2 py-1 text-right text-xs ${
            calendarLayout === "month" // if month layout, highlight current month days
              ? date.is_current_month
                ? "font-medium"
                : "text-custom-text-300"
              : "font-medium" // if week layout, highlight all days
          } ${
            date.date.getDay() === 0 || date.date.getDay() === 6
              ? "bg-custom-background-90"
              : "bg-custom-background-100"
          }`}
        >
          {date.date.getDate() === 1 && MONTHS_LIST[date.date.getMonth() + 1].shortTitle + " "}
          {date.date.getDate()}
        </div>

        {/* content */}
        <div className="h-full w-full">
          <Droppable droppableId={renderDateFormat(date.date)} isDropDisabled={false}>
            {(provided, snapshot) => (
              <div
                className={`h-full w-full select-none overflow-y-auto ${
                  snapshot.isDraggingOver || date.date.getDay() === 0 || date.date.getDay() === 6
                    ? "bg-custom-background-90"
                    : "bg-custom-background-100"
                } ${calendarLayout === "month" ? "min-h-[9rem]" : ""}`}
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                <CalendarIssueBlocks
                  issues={issues}
                  issueIdList={issueIdList}
                  quickActions={quickActions}
                  showAllIssues={showAllIssues}
                />

                {enableQuickIssueCreate && !disableIssueCreation && (
                  <div className="px-2 py-1">
                    <CalendarQuickAddIssueForm
                      formKey="target_date"
                      groupId={renderDateFormat(date.date)}
                      prePopulatedData={{
                        target_date: renderDateFormat(date.date),
                      }}
                      quickAddCallback={quickAddCallback}
                      viewId={viewId}
                      onOpen={() => setShowAllIssues(true)}
                    />
                  </div>
                )}

                {totalIssues > 4 && (
                  <div className="flex items-center px-2.5 py-1">
                    <button
                      type="button"
                      className="w-min whitespace-nowrap rounded text-xs px-1.5 py-1 text-custom-text-400 font-medium  hover:bg-custom-background-80 hover:text-custom-text-300"
                      onClick={() => setShowAllIssues((prevData) => !prevData)}
                    >
                      {showAllIssues ? "Hide" : totalIssues - 4 + " more"}
                    </button>
                  </div>
                )}

                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    </>
  );
});
