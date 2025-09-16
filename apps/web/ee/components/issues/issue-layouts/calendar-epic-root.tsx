import { observer } from "mobx-react";
import { BaseCalendarRoot } from "@/components/issues/issue-layouts/calendar/base-calendar-root";
import { ProjectEpicQuickActions } from "@/plane-web/components/epics/quick-actions/epic-quick-action";

export const EpicCalendarLayout: React.FC = observer(() => (
  <BaseCalendarRoot QuickActions={ProjectEpicQuickActions} isEpic />
));
