import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// components
import { IssueListView } from "components/issues/board-views/list";
import { IssueKanbanView } from "components/issues/board-views/kanban";
import { IssueCalendarView } from "components/issues/board-views/calendar";
import { IssueSpreadsheetView } from "components/issues/board-views/spreadsheet";
import { IssueGanttView } from "components/issues/board-views/gantt";
import { IssuePeekOverview } from "components/issues/peek-overview";
// mobx store
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";
import { useEffect } from "react";

export const ProjectDetailsView = () => {
  const router = useRouter();
  const { workspace_slug, project_slug, states, labels, priorities } = router.query;

  const { issue: issueStore }: RootStore = useMobxStore();

  const activeIssueId = issueStore.activePeekOverviewIssueId;

  useEffect(() => {
    if (workspace_slug && project_slug) {
      const params = {
        state: states || null,
        labels: labels || null,
        priority: priorities || null,
      };
      issueStore.fetchPublicIssues(workspace_slug?.toString(), project_slug.toString(), params);
    }
  }, [workspace_slug, project_slug, issueStore, states, labels, priorities]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {workspace_slug && (
        <IssuePeekOverview
          isOpen={Boolean(activeIssueId)}
          onClose={() => issueStore.setActivePeekOverviewIssueId(null)}
          issue={issueStore?.issues?.find((_issue) => _issue.id === activeIssueId) || null}
          workspaceSlug={workspace_slug.toString()}
        />
      )}

      {issueStore?.loader && !issueStore.issues ? (
        <div className="text-sm text-center py-10 text-custom-text-100">Loading...</div>
      ) : (
        <>
          {issueStore?.error ? (
            <div className="text-sm text-center py-10  bg-custom-background-200 text-custom-text-100">
              Something went wrong.
            </div>
          ) : (
            issueStore?.currentIssueBoardView && (
              <>
                {issueStore?.currentIssueBoardView === "list" && (
                  <div className="relative w-full h-full overflow-y-auto">
                    <div className="mx-auto px-4">
                      <IssueListView />
                    </div>
                  </div>
                )}
                {issueStore?.currentIssueBoardView === "kanban" && (
                  <div className="relative w-full h-full mx-auto px-9 py-5">
                    <IssueKanbanView />
                  </div>
                )}
                {issueStore?.currentIssueBoardView === "calendar" && <IssueCalendarView />}
                {issueStore?.currentIssueBoardView === "spreadsheet" && <IssueSpreadsheetView />}
                {issueStore?.currentIssueBoardView === "gantt" && <IssueGanttView />}
              </>
            )
          )}
        </>
      )}
    </div>
  );
};
