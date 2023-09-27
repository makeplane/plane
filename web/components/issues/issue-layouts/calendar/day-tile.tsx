import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
import { Droppable } from "@hello-pangea/dnd";
// components
import { CalendarIssueBlocks, ICalendarDate } from "components/issues";
// helpers
import { renderDateFormat } from "helpers/date-time.helper";
// types
import { IIssueGroupedStructure } from "store/issue";

type Props = { date: ICalendarDate | null };

export const CalendarDayTile: React.FC<Props> = observer((props) => {
  const { date } = props;

  const { issue: issueStore } = useMobxStore();

  if (!date) return <div data-date="null" className="min-h-[9rem] p-2 space-y-1" />;

  const issues = issueStore.getIssues
    ? (issueStore.getIssues as IIssueGroupedStructure)[renderDateFormat(date.date)]
    : null;

  return (
    <Droppable droppableId={renderDateFormat(date.date)} isDropDisabled={date === null}>
      {(provided, snapshot) => (
        <div
          className={`min-h-[9rem] p-2 space-y-1 ${
            snapshot.isDraggingOver ? "bg-custom-background-90" : "bg-custom-background-100"
          }`}
          data-date={renderDateFormat(date.date)}
          {...provided.droppableProps}
          ref={provided.innerRef}
        >
          <>
            {date && <div className="text-xs text-right sticky top-2">{date.date.getDate()}</div>}
            <div>
              <CalendarIssueBlocks issues={issues} />
            </div>
            {provided.placeholder}
          </>
        </div>
      )}
    </Droppable>
  );
});
