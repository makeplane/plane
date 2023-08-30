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

export const ProjectDetailsView = () => {
  const router = useRouter();
  const { workspace_slug } = router.query;

  const store: RootStore = useMobxStore();

  const activeIssueId = store.issue.activePeekOverviewIssueId;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {workspace_slug && (
        <IssuePeekOverview
          isOpen={Boolean(activeIssueId)}
          onClose={() => store.issue.setActivePeekOverviewIssueId(null)}
          issue={store?.issue?.issues?.find((_issue) => _issue.id === activeIssueId) || null}
          workspaceSlug={workspace_slug.toString()}
        />
      )}

      {store?.issue?.loader && !store.issue.issues ? (
        <div className="text-sm text-center py-10 text-custom-text-100">Loading...</div>
      ) : (
        <>
          {store?.issue?.error ? (
            <div className="text-sm text-center py-10  bg-custom-background-200 text-custom-text-100">
              Something went wrong.
            </div>
          ) : (
            store?.issue?.currentIssueBoardView && (
              <>
                {store?.issue?.currentIssueBoardView === "list" && (
                  <div className="relative w-full h-full overflow-y-auto">
                    <div className="mx-auto px-4">
                      <IssueListView />
                    </div>
                  </div>
                )}
                {store?.issue?.currentIssueBoardView === "kanban" && (
                  <div className="relative w-full h-full mx-auto px-9 py-5">
                    <IssueKanbanView />
                  </div>
                )}
                {store?.issue?.currentIssueBoardView === "calendar" && <IssueCalendarView />}
                {store?.issue?.currentIssueBoardView === "spreadsheet" && <IssueSpreadsheetView />}
                {store?.issue?.currentIssueBoardView === "gantt" && <IssueGanttView />}
              </>
            )
          )}
        </>
      )}
    </div>
  );
};
