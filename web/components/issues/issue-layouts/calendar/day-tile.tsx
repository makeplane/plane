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

type Props = { activeMonthDate: Date; date: ICalendarDate };

export const CalendarDayTile: React.FC<Props> = observer((props) => {
  const { activeMonthDate, date } = props;

  const { issue: issueStore } = useMobxStore();

  const issues = issueStore.getIssues
    ? (issueStore.getIssues as IIssueGroupedStructure)[renderDateFormat(date.date)]
    : null;

  return (
    <Droppable droppableId={renderDateFormat(date.date)}>
      {(provided, snapshot) => (
        <div
          className={`min-h-[9rem] p-2 space-y-1 ${
            snapshot.isDraggingOver ? "bg-custom-background-90" : "bg-custom-background-100"
          }`}
          {...provided.droppableProps}
          ref={provided.innerRef}
        >
          <>
            {date && (
              <div
                className={`text-xs text-right ${
                  activeMonthDate.getMonth() !== date.date.getMonth() ? "text-custom-text-300" : "font-medium"
                }`}
              >
                {date.date.getDate() === 1 && MONTHS_LIST[date.date.getMonth() + 1].shortTitle + " "}
                {date.date.getDate()}
              </div>
            )}
            <CalendarIssueBlocks issues={issues} />
            {provided.placeholder}
          </>
        </div>
      )}
    </Droppable>
  );
});
