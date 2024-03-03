import { observer } from "mobx-react-lite";
// components
import { ProjectIssueQuickActions } from "components/issues";
import { BaseCalendarRoot } from "../base-calendar-root";
import { EIssuesStoreType } from "constants/issue";

export const CalendarLayout: React.FC = observer(() => (
  <BaseCalendarRoot QuickActions={ProjectIssueQuickActions} storeType={EIssuesStoreType.PROJECT} />
));
