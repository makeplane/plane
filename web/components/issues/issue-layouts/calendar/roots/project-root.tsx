import { observer } from "mobx-react-lite";
// hooks
import { ProjectIssueQuickActions } from "@/components/issues";
import { EIssuesStoreType } from "@/constants/issue";
// components
import { BaseCalendarRoot } from "../base-calendar-root";

export const CalendarLayout: React.FC = observer(() => (
  <BaseCalendarRoot QuickActions={ProjectIssueQuickActions} storeType={EIssuesStoreType.PROJECT} />
));
