import { observer } from "mobx-react-lite";
import { Droppable } from "@hello-pangea/dnd";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CalendarIssueBlocks, ICalendarDate, CalendarQuickAddIssueForm } from "components/issues";
// helpers
import { renderDateFormat } from "helpers/date-time.helper";
// constants
import { MONTHS_LIST } from "constants/calendar";
import { IIssue } from "types";
import { IGroupedIssues, IIssueResponse } from "store/issues/types";

type Props = {
  date: ICalendarDate;
  issues: IIssueResponse | undefined;
  groupedIssueIds: IGroupedIssues;
  quickActions: (issue: IIssue) => React.ReactNode;
  enableQuickIssueCreate?: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: IIssue,
    viewId?: string
  ) => Promise<IIssue | undefined>;
  viewId?: string;
};

export const CalendarDayTile: React.FC<Props> = observer((props) => {
  const { date, issues, groupedIssueIds, quickActions, enableQuickIssueCreate, quickAddCallback, viewId } = props;

  const { issueFilter: issueFilterStore } = useMobxStore();

  const calendarLayout = issueFilterStore.userDisplayFilters.calendar?.layout ?? "month";

  const issueIdList = groupedIssueIds ? groupedIssueIds[renderDateFormat(date.date)] : null;

  return (
    <>
      <div className="group w-full h-full relative flex flex-col bg-custom-background-90">
        {/* header */}
        <div
          className={`text-xs text-right flex-shrink-0 py-1 px-2 ${
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
        <div className="w-full h-full">
          <Droppable droppableId={renderDateFormat(date.date)} isDropDisabled={false}>
            {(provided, snapshot) => (
              <div
                className={`h-full w-full overflow-y-auto select-none ${
                  snapshot.isDraggingOver || date.date.getDay() === 0 || date.date.getDay() === 6
                    ? "bg-custom-background-90"
                    : "bg-custom-background-100"
                } ${calendarLayout === "month" ? "min-h-[9rem]" : ""}`}
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                <CalendarIssueBlocks issues={issues} issueIdList={issueIdList} quickActions={quickActions} />
                {enableQuickIssueCreate && (
                  <div className="py-1 px-2">
                    <CalendarQuickAddIssueForm
                      formKey="target_date"
                      groupId={renderDateFormat(date.date)}
                      prePopulatedData={{
                        target_date: renderDateFormat(date.date),
                      }}
                      quickAddCallback={quickAddCallback}
                      viewId={viewId}
                    />
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
