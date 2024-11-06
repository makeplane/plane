import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { ProjectIssueQuickActions } from "@/components/issues";
// components
// types
import { BaseCalendarRoot } from "../base-calendar-root";
// constants

export const ProjectViewCalendarLayout: React.FC = observer(() => {
  const { viewId } = useParams();

  return <BaseCalendarRoot QuickActions={ProjectIssueQuickActions} viewId={viewId.toString()} />;
});
