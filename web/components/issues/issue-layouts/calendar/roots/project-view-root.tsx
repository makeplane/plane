import { observer } from "mobx-react";
import { useRouter } from "next/router";
// hooks
import { ProjectIssueQuickActions } from "@/components/issues";
import { EIssuesStoreType } from "@/constants/issue";
// components
// types
import { BaseCalendarRoot } from "../base-calendar-root";
// constants

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
