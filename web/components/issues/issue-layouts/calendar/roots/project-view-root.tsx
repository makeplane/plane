import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { ProjectIssueQuickActions } from "@/components/issues";
// components
// types
import { BaseCalendarRoot } from "../base-calendar-root";
// constants

export const ProjectViewCalendarLayout: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { viewId } = router.query;

  return <BaseCalendarRoot QuickActions={ProjectIssueQuickActions} viewId={viewId?.toString()} />;
});
