import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// local imports
import { ProjectIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseCalendarRoot } from "../base-calendar-root";

export const ProjectViewCalendarLayout = observer(function ProjectViewCalendarLayout() {
  const { viewId } = useParams();

  return <BaseCalendarRoot QuickActions={ProjectIssueQuickActions} viewId={viewId.toString()} />;
});
