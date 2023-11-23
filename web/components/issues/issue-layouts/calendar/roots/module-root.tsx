import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ModuleIssueQuickActions } from "components/issues";
// types
import { IIssue } from "types";
import { EIssueActions } from "../../types";
import { BaseCalendarRoot } from "../base-calendar-root";

export const ModuleCalendarLayout: React.FC = observer(() => {
  const { moduleIssues: moduleIssueStore, moduleIssueCalendarView: moduleIssueCalendarViewStore } = useMobxStore();

  const router = useRouter();
  const { workspaceSlug, moduleId } = router.query as { workspaceSlug: string; moduleId: string };

  const issueActions = {
    [EIssueActions.UPDATE]: (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;
      moduleIssueStore.updateIssue(workspaceSlug, issue.project, issue.id, issue, moduleId);
    },
    [EIssueActions.DELETE]: (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;
      moduleIssueStore.removeIssue(workspaceSlug, issue.project, issue.id, moduleId);
    },
    [EIssueActions.REMOVE]: (issue: IIssue) => {
      if (!workspaceSlug || !moduleId || !issue.bridge_id) return;
      moduleIssueStore.removeIssueFromModule(workspaceSlug, issue.project, moduleId, issue.id, issue.bridge_id);
    },
  };

  return (
    <BaseCalendarRoot
      issueStore={moduleIssueStore}
      calendarViewStore={moduleIssueCalendarViewStore}
      QuickActions={ModuleIssueQuickActions}
      issueActions={issueActions}
      viewId={moduleId}
    />
  );
});
