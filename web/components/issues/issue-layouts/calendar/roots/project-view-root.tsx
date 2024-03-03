import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// components
import { ProjectIssueQuickActions } from "components/issues";
import { BaseCalendarRoot } from "../base-calendar-root";
// constants
import { EIssuesStoreType } from "constants/issue";

export const ProjectViewCalendarLayout: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { viewId } = router.query;

  return (
    <BaseCalendarRoot
      QuickActions={ProjectIssueQuickActions}
      viewId={viewId?.toString()}
      storeType={EIssuesStoreType.PROJECT_VIEW}
    />
  );
});
