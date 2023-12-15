import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// components
import { IssueListView } from "components/issues/board-views/list";
import { IssueKanbanView } from "components/issues/board-views/kanban";
import { IssueCalendarView } from "components/issues/board-views/calendar";
import { IssueSpreadsheetView } from "components/issues/board-views/spreadsheet";
import { IssueGanttView } from "components/issues/board-views/gantt";
import { IssuePeekOverview } from "components/issues/peek-overview";
import { IssueAppliedFilters } from "components/issues/filters/applied-filters/root";
// mobx store
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";
// assets
import SomethingWentWrongImage from "public/something-went-wrong.svg";

export const ProjectDetailsView = observer(() => {
  const router = useRouter();
  const { workspace_slug, project_slug, states, labels, priorities, peekId } = router.query;

  const {
    issue: issueStore,
    project: projectStore,
    issueDetails: issueDetailStore,
    user: userStore,
  }: RootStore = useMobxStore();

  useEffect(() => {
    if (!userStore.currentUser) {
      userStore.fetchCurrentUser();
    }
  }, [userStore]);

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

  useEffect(() => {
    if (peekId && workspace_slug && project_slug) {
      issueDetailStore.setPeekId(peekId.toString());
    }
  }, [peekId, issueDetailStore, project_slug, workspace_slug]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {workspace_slug && <IssuePeekOverview />}

      {issueStore?.loader && !issueStore.issues ? (
        <div className="py-10 text-center text-sm text-custom-text-100">Loading...</div>
      ) : (
        <>
          {issueStore?.error ? (
            <div className="grid h-full w-full place-items-center p-6">
              <div className="text-center">
                <div className="mx-auto grid h-52 w-52 place-items-center rounded-full bg-custom-background-80">
                  <div className="grid h-32 w-32 place-items-center">
                    <Image src={SomethingWentWrongImage} alt="Oops! Something went wrong" />
                  </div>
                </div>
                <h1 className="mt-12 text-3xl font-semibold">Oops! Something went wrong.</h1>
                <p className="mt-4 text-custom-text-300">The public board does not exist. Please check the URL.</p>
              </div>
            </div>
          ) : (
            projectStore?.activeBoard && (
              <div className="relative flex h-full w-full flex-col overflow-hidden">
                {/* applied filters */}
                <IssueAppliedFilters />

                {projectStore?.activeBoard === "list" && (
                  <div className="relative h-full w-full overflow-y-auto">
                    <IssueListView />
                  </div>
                )}
                {projectStore?.activeBoard === "kanban" && (
                  <div className="relative mx-auto h-full w-full p-5">
                    <IssueKanbanView />
                  </div>
                )}
                {projectStore?.activeBoard === "calendar" && <IssueCalendarView />}
                {projectStore?.activeBoard === "spreadsheet" && <IssueSpreadsheetView />}
                {projectStore?.activeBoard === "gantt" && <IssueGanttView />}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
});
