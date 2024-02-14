import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Droppable } from "@hello-pangea/dnd";
// components
import { CalendarIssueBlocks, ICalendarDate, CalendarQuickAddIssueForm } from "components/issues";
// helpers
import { renderFormattedPayloadDate } from "helpers/date-time.helper";
// constants
import { MONTHS_LIST } from "constants/calendar";
import { TGroupedIssues, TIssue, TIssueMap } from "@plane/types";
import { ICycleIssuesFilter } from "store/issue/cycle";
import { IModuleIssuesFilter } from "store/issue/module";
import { IProjectIssuesFilter } from "store/issue/project";
import { IProjectViewIssuesFilter } from "store/issue/project-views";

type Props = {
  issuesFilterStore: IProjectIssuesFilter | IModuleIssuesFilter | ICycleIssuesFilter | IProjectViewIssuesFilter;
  date: ICalendarDate;
  issues: TIssueMap | undefined;
  groupedIssueIds: TGroupedIssues;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  enableQuickIssueCreate?: boolean;
  disableIssueCreation?: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  viewId?: string;
  readOnly?: boolean;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
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
    readOnly = false,
    selectedDate,
    setSelectedDate,
  } = props;
  const [showAllIssues, setShowAllIssues] = useState(false);
  const calendarLayout = issuesFilterStore?.issueFilters?.displayFilters?.calendar?.layout ?? "month";

  const formattedDatePayload = renderFormattedPayloadDate(date.date);
  if (!formattedDatePayload) return null;
  const issueIdList = groupedIssueIds ? groupedIssueIds[formattedDatePayload] : null;

  const totalIssues = issueIdList?.length ?? 0;
  const isToday = date.date.toDateString() == new Date().toDateString();
  const isSelectedDate = date.date.toDateString() == selectedDate.toDateString();

  return (
    <>
      <div className="group relative flex h-full w-full flex-col md:bg-custom-background-90">
        {/* header */}
        <div
          className={`hidden md:block flex-shrink-0 px-2 py-1 text-right text-xs ${
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
        <div className="h-full w-full hidden md:block">
          <Droppable droppableId={formattedDatePayload} isDropDisabled={readOnly}>
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
                  isDragDisabled={readOnly}
                />

                {enableQuickIssueCreate && !disableIssueCreation && !readOnly && (
                  <div className="px-2 py-1">
                    <CalendarQuickAddIssueForm
                      formKey="target_date"
                      groupId={formattedDatePayload}
                      prePopulatedData={{
                        target_date: renderFormattedPayloadDate(date.date) ?? undefined,
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
        <div
          onClick={() => setSelectedDate(date.date)}
          className="text-sm my-2 font-medium mx-auto flex flex-col justify-center items-center md:hidden cursor-pointer"
        >
          <div
            className={`h-6 w-6 rounded-full flex items-center justify-center ${
              isSelectedDate
                ? "bg-custom-primary-100 text-white"
                : isToday
                ? "bg-custom-primary-100/10 text-custom-primary-100 "
                : ""
            }`}
          >
            {date.date.getDate()}
          </div>

          {totalIssues > 0 && <div className="flex flex-shrink-0 h-1.5 w-1.5 bg-custom-primary-100 rounded mt-1" />}
        </div>
      </div>
    </>
  );
});
