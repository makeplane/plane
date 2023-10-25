import { observer } from "mobx-react-lite";
import { Droppable } from "@hello-pangea/dnd";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CalendarIssueBlocks, ICalendarDate } from "components/issues";
// helpers
import { renderDateFormat } from "helpers/date-time.helper";
// types
import { IIssueGroupedStructure } from "store/issue";
// constants
import { MONTHS_LIST } from "constants/calendar";
import { IIssue } from "types";

type Props = {
  date: ICalendarDate;
  issues: IIssueGroupedStructure | null;
  quickActions: (issue: IIssue) => React.ReactNode;
};

export const CalendarDayTile: React.FC<Props> = observer((props) => {
  const { date, issues, quickActions } = props;

  const { issueFilter: issueFilterStore } = useMobxStore();

  const calendarLayout = issueFilterStore.userDisplayFilters.calendar?.layout ?? "month";

  const issuesList = issues ? (issues as IIssueGroupedStructure)[renderDateFormat(date.date)] : null;

  return (
    <>
      <div className="w-full h-full relative flex flex-col bg-custom-background-90">
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
                <CalendarIssueBlocks issues={issuesList} quickActions={quickActions} />
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    </>
  );
});
