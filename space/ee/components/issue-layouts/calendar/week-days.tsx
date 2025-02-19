import { observer } from "mobx-react";
import { TGroupedIssues, TPaginationData } from "@plane/types";
// helpers
import { renderFormattedPayloadDate } from "@/plane-web/helpers/date-time.helper";
// types
import { IIssue } from "@/types/issue";
//
import { CalendarDayTile } from "./day-tile";
import { ICalendarDate, ICalendarWeek } from "./types";

type Props = {
  getIssueById: (issueId: string) => IIssue | undefined;
  groupedIssueIds: TGroupedIssues;
  week: ICalendarWeek | undefined;
  calendarLayout: "month" | "week" | undefined;
  showWeekends: boolean;
  loadMoreIssues: (dateString: string) => void;
  getPaginationData: (groupId: string | undefined) => TPaginationData | undefined;
  getGroupIssueCount: (groupId: string | undefined) => number | undefined;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
};

export const CalendarWeekDays: React.FC<Props> = observer((props) => {
  const {
    getIssueById,
    groupedIssueIds,
    week,
    calendarLayout,
    showWeekends,
    loadMoreIssues,
    getPaginationData,
    getGroupIssueCount,
    selectedDate,
    setSelectedDate,
  } = props;

  if (!week) return null;

  return (
    <div
      className={`grid divide-custom-border-200 md:divide-x-[0.5px] ${showWeekends ? "grid-cols-7" : "grid-cols-5"} ${
        calendarLayout === "month" ? "" : "h-full"
      }`}
    >
      {Object.values(week).map((date: ICalendarDate) => {
        if (!showWeekends && (date.date.getDay() === 0 || date.date.getDay() === 6)) return null;

        return (
          <CalendarDayTile
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            key={renderFormattedPayloadDate(date.date)}
            calendarLayout={calendarLayout}
            date={date}
            getIssueById={getIssueById}
            groupedIssueIds={groupedIssueIds}
            loadMoreIssues={loadMoreIssues}
            getPaginationData={getPaginationData}
            getGroupIssueCount={getGroupIssueCount}
          />
        );
      })}
    </div>
  );
});
