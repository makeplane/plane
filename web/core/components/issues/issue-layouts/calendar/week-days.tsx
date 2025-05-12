import { observer } from "mobx-react";
import { EStartOfTheWeek } from "@plane/constants";
import { TGroupedIssues, TIssue, TIssueMap, TPaginationData } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { CalendarDayTile } from "@/components/issues";
// helpers
import { getOrderedDays } from "@/helpers/calendar.helper";
import { renderFormattedPayloadDate } from "@/helpers/date-time.helper";
// hooks
import { useUserProfile } from "@/hooks/store";
// types
import { IProjectEpicsFilter } from "@/plane-web/store/issue/epic";
import { ICycleIssuesFilter } from "@/store/issue/cycle";
import { IModuleIssuesFilter } from "@/store/issue/module";
import { IProjectIssuesFilter } from "@/store/issue/project";
import { IProjectViewIssuesFilter } from "@/store/issue/project-views";
import { TRenderQuickActions } from "../list/list-view-types";
import { ICalendarDate, ICalendarWeek } from "./types";

type Props = {
  issuesFilterStore:
    | IProjectIssuesFilter
    | IModuleIssuesFilter
    | ICycleIssuesFilter
    | IProjectViewIssuesFilter
    | IProjectEpicsFilter;
  issues: TIssueMap | undefined;
  groupedIssueIds: TGroupedIssues;
  week: ICalendarWeek | undefined;
  quickActions: TRenderQuickActions;
  loadMoreIssues: (dateString: string) => void;
  getPaginationData: (groupId: string | undefined) => TPaginationData | undefined;
  getGroupIssueCount: (groupId: string | undefined) => number | undefined;
  enableQuickIssueCreate?: boolean;
  disableIssueCreation?: boolean;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  handleDragAndDrop: (
    issueId: string | undefined,
    issueProjectId: string | undefined,
    sourceDate: string | undefined,
    destinationDate: string | undefined
  ) => Promise<void>;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  readOnly?: boolean;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  canEditProperties: (projectId: string | undefined) => boolean;
  isEpic?: boolean;
};

export const CalendarWeekDays: React.FC<Props> = observer((props) => {
  const {
    issuesFilterStore,
    issues,
    groupedIssueIds,
    handleDragAndDrop,
    week,
    loadMoreIssues,
    getPaginationData,
    getGroupIssueCount,
    quickActions,
    enableQuickIssueCreate,
    disableIssueCreation,
    quickAddCallback,
    addIssuesToView,
    readOnly = false,
    selectedDate,
    setSelectedDate,
    canEditProperties,
    isEpic = false,
  } = props;
  // hooks
  const { data } = useUserProfile();
  const startOfWeek = data?.start_of_the_week;

  const calendarLayout = issuesFilterStore?.issueFilters?.displayFilters?.calendar?.layout ?? "month";
  const showWeekends = issuesFilterStore?.issueFilters?.displayFilters?.calendar?.show_weekends ?? false;

  if (!week) return null;

  const shouldShowDay = (dayDate: Date) => {
    if (showWeekends) return true;
    const day = dayDate.getDay();
    return !(day === 0 || day === 6);
  };

  const sortedWeekDays = getOrderedDays(Object.values(week), (item) => item.date.getDay(), startOfWeek);

  return (
    <div
      className={cn("grid divide-custom-border-200 md:divide-x-[0.5px]", {
        "grid-cols-7": showWeekends,
        "grid-cols-5": !showWeekends,
        "h-full": calendarLayout !== "month",
      })}
    >
      {sortedWeekDays.map((date: ICalendarDate) => {
        if (!shouldShowDay(date.date)) return null;

        return (
          <CalendarDayTile
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            issuesFilterStore={issuesFilterStore}
            key={renderFormattedPayloadDate(date.date)}
            date={date}
            issues={issues}
            groupedIssueIds={groupedIssueIds}
            loadMoreIssues={loadMoreIssues}
            getPaginationData={getPaginationData}
            getGroupIssueCount={getGroupIssueCount}
            quickActions={quickActions}
            enableQuickIssueCreate={enableQuickIssueCreate}
            disableIssueCreation={disableIssueCreation}
            quickAddCallback={quickAddCallback}
            addIssuesToView={addIssuesToView}
            readOnly={readOnly}
            handleDragAndDrop={handleDragAndDrop}
            canEditProperties={canEditProperties}
            isEpic={isEpic}
          />
        );
      })}
    </div>
  );
});
