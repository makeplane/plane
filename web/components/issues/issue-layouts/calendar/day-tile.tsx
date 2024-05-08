import { Droppable } from "@hello-pangea/dnd";
import { observer } from "mobx-react-lite";
// types
import { TGroupedIssues, TIssue, TIssueMap } from "@plane/types";
// components
import { CalendarIssueBlocks, ICalendarDate } from "@/components/issues";
// constants
import { MONTHS_LIST } from "@/constants/calendar";
// helpers
import { cn } from "@/helpers/common.helper";
import { renderFormattedPayloadDate } from "@/helpers/date-time.helper";
// types
import { ICycleIssuesFilter } from "@/store/issue/cycle";
import { IModuleIssuesFilter } from "@/store/issue/module";
import { IProjectIssuesFilter } from "@/store/issue/project";
import { IProjectViewIssuesFilter } from "@/store/issue/project-views";
import { TRenderQuickActions } from "../list/list-view-types";

type Props = {
  issuesFilterStore: IProjectIssuesFilter | IModuleIssuesFilter | ICycleIssuesFilter | IProjectViewIssuesFilter;
  date: ICalendarDate;
  issues: TIssueMap | undefined;
  groupedIssueIds: TGroupedIssues;
  quickActions: TRenderQuickActions;
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
    addIssuesToView,
    viewId,
    readOnly = false,
    selectedDate,
    setSelectedDate,
  } = props;

  const calendarLayout = issuesFilterStore?.issueFilters?.displayFilters?.calendar?.layout ?? "month";

  const formattedDatePayload = renderFormattedPayloadDate(date.date);
  if (!formattedDatePayload) return null;
  const issueIdList = groupedIssueIds ? groupedIssueIds[formattedDatePayload] : null;

  const totalIssues = issueIdList?.length ?? 0;

  const isToday = date.date.toDateString() === new Date().toDateString();
  const isSelectedDate = date.date.toDateString() == selectedDate.toDateString();

  return (
    <>
      <div className="group relative flex h-full w-full flex-col bg-custom-background-90">
        {/* header */}
        <div
          className={`hidden flex-shrink-0 items-center justify-end px-2 py-1.5 text-right text-xs md:flex ${
            calendarLayout === "month" // if month layout, highlight current month days
              ? date.is_current_month
                ? "font-medium"
                : "text-custom-text-300"
              : "font-medium" // if week layout, highlight all days
          } ${
            date.date.getDay() === 0 || date.date.getDay() === 6
              ? "bg-custom-background-90"
              : "bg-custom-background-100"
          } `}
        >
          {date.date.getDate() === 1 && MONTHS_LIST[date.date.getMonth() + 1].shortTitle + " "}
          {isToday ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-custom-primary-100 text-white">
              {date.date.getDate()}
            </span>
          ) : (
            <>{date.date.getDate()}</>
          )}
        </div>

        {/* content */}
        <div className="hidden h-full w-full md:block">
          <Droppable droppableId={formattedDatePayload} isDropDisabled={readOnly}>
            {(provided, snapshot) => (
              <div
                className={`h-full w-full select-none ${
                  snapshot.isDraggingOver || date.date.getDay() === 0 || date.date.getDay() === 6
                    ? "bg-custom-background-90"
                    : "bg-custom-background-100"
                } ${calendarLayout === "month" ? "min-h-[5rem]" : ""}`}
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                <CalendarIssueBlocks
                  date={date.date}
                  issues={issues}
                  issueIdList={issueIdList}
                  quickActions={quickActions}
                  isDragDisabled={readOnly}
                  addIssuesToView={addIssuesToView}
                  disableIssueCreation={disableIssueCreation}
                  enableQuickIssueCreate={enableQuickIssueCreate}
                  quickAddCallback={quickAddCallback}
                  viewId={viewId}
                  readOnly={readOnly}
                />
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Mobile view content */}
        <div
          onClick={() => setSelectedDate(date.date)}
          className={cn(
            "mx-auto flex h-full w-full cursor-pointer flex-col items-center justify-start py-2.5 text-sm font-medium md:hidden",
            {
              "bg-custom-background-100": date.date.getDay() !== 0 && date.date.getDay() !== 6,
            }
          )}
        >
          <div
            className={cn("flex h-6  w-6 items-center justify-center rounded-full ", {
              "bg-custom-primary-100 text-white": isSelectedDate,
              "bg-custom-primary-100/10 text-custom-primary-100 ": isToday && !isSelectedDate,
            })}
          >
            {date.date.getDate()}
          </div>

          {totalIssues > 0 && <div className="mt-1 flex h-1.5 w-1.5 flex-shrink-0 rounded bg-custom-primary-100" />}
        </div>
      </div>
    </>
  );
});
