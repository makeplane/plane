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

type Props = { date: ICalendarDate; issues: IIssueGroupedStructure | null };

export const CalendarDayTile: React.FC<Props> = observer((props) => {
  const { date, issues } = props;

  const { issueFilter: issueFilterStore } = useMobxStore();

  const calendarLayout = issueFilterStore.userDisplayFilters.calendar?.layout ?? "month";

  const issuesList = issues ? (issues as IIssueGroupedStructure)[renderDateFormat(date.date)] : null;

  return (
    <Droppable droppableId={renderDateFormat(date.date)}>
      {(provided, snapshot) => (
        <div
          className={`flex-grow p-2 space-y-1 w-full flex flex-col overflow-hidden ${
            snapshot.isDraggingOver || date.date.getDay() === 0 || date.date.getDay() === 6
              ? "bg-custom-background-90"
              : "bg-custom-background-100"
          } ${calendarLayout === "month" ? "min-h-[9rem]" : ""}`}
          {...provided.droppableProps}
          ref={provided.innerRef}
        >
          <>
            <div
              className={`text-xs text-right ${
                calendarLayout === "month" // if month layout, highlight current month days
                  ? date.is_current_month
                    ? "font-medium"
                    : "text-custom-text-300"
                  : "font-medium" // if week layout, highlight all days
              }`}
            >
              {date.date.getDate() === 1 && MONTHS_LIST[date.date.getMonth() + 1].shortTitle + " "}
              {date.date.getDate()}
            </div>
            <CalendarIssueBlocks issues={issuesList} />
            {provided.placeholder}
          </>
        </div>
      )}
    </Droppable>
  );
});
