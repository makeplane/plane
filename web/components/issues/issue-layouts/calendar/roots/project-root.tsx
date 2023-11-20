import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ProjectIssueQuickActions } from "components/issues";
import { BaseCalendarRoot } from "../base-calendar-root";

export const CalendarLayout: React.FC = observer(() => {
  const { projectIssues: issueStore, issueCalendarView: issueCalendarViewStore } = useMobxStore();

  return (
    <BaseCalendarRoot
      issueStore={issueStore}
      calendarViewStore={issueCalendarViewStore}
      QuickActions={ProjectIssueQuickActions}
    />
  );
});
