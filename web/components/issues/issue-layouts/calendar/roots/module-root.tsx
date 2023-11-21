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
  const {
    moduleIssues: moduleIssueStore,
    moduleIssueCalendarView: moduleIssueCalendarViewStore,
    issueDetail: issueDetailStore,
  } = useMobxStore();

  const router = useRouter();
  const { workspaceSlug, moduleId } = router.query;

  // const handleIssues = useCallback(
  //   (date: string, issue: IIssue, action: "update" | "delete" | "remove") => {
  //     if (!workspaceSlug || !moduleId) return;

  //     if (action === "update") {
  //       moduleIssueStore.updateIssueStructure(date, null, issue);
  //       issueDetailStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, issue);
  //     } else {
  //       moduleIssueStore.deleteIssue(date, null, issue);
  //       issueDetailStore.deleteIssue(workspaceSlug.toString(), issue.project, issue.id);
  //     }
  //     if (action === "remove" && issue.bridge_id) {
  //       moduleIssueStore.deleteIssue(date, null, issue);
  //       moduleIssueStore.removeIssueFromModule(
  //         workspaceSlug.toString(),
  //         issue.project,
  //         moduleId.toString(),
  //         issue.bridge_id
  //       );
  //     }
  //   },
  //   [moduleIssueStore, issueDetailStore, moduleId, workspaceSlug]
  // );

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;

      moduleIssueStore.updateIssue(
        workspaceSlug.toString(),
        issue.project,
        moduleId?.toString() || "",
        issue.id,
        issue
      );
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;
      issueDetailStore.deleteIssue(workspaceSlug.toString(), issue.project, issue.id);
      //moduleIssueStore.  (workspaceSlug.toString(), issue.project, moduleId?.toString() || "", issue.id, issue);
    },
    [EIssueActions.REMOVE]: async (issue: IIssue) => {
      if (!workspaceSlug || !moduleId) return;
      moduleIssueStore.removeIssue(workspaceSlug.toString(), issue.project, moduleId?.toString() || "", issue.id);
    },
  };

  return (
    <BaseCalendarRoot
      issueStore={moduleIssueStore}
      calendarViewStore={moduleIssueCalendarViewStore}
      QuickActions={ModuleIssueQuickActions}
      issueActions={issueActions}
    />
  );
});
