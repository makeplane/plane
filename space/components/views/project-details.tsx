"use client";

import { FC, useEffect } from "react";
import { observer } from "mobx-react-lite";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
// components
import { IssueCalendarView } from "@/components/issues/board-views/calendar";
import { IssueGanttView } from "@/components/issues/board-views/gantt";
import { IssueKanbanView } from "@/components/issues/board-views/kanban";
import { IssueListView } from "@/components/issues/board-views/list";
import { IssueSpreadsheetView } from "@/components/issues/board-views/spreadsheet";
import { IssueAppliedFilters } from "@/components/issues/filters/applied-filters/root";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
// mobx store
import { useIssue, useUser, useIssueDetails, useIssueFilter, useProject } from "@/hooks/store";
// assets
import SomethingWentWrongImage from "public/something-went-wrong.svg";

type ProjectDetailsViewProps = {
  workspaceSlug: string;
  projectId: string;
  peekId: string | undefined;
};

export const ProjectDetailsView: FC<ProjectDetailsViewProps> = observer((props) => {
  // router
  const searchParams = useSearchParams();
  // query params
  const states = searchParams.get("states") || undefined;
  const priority = searchParams.get("priority") || undefined;
  const labels = searchParams.get("labels") || undefined;

  const { workspaceSlug, projectId, peekId } = props;
  // hooks
  const { fetchProjectSettings } = useProject();
  const { issueFilters } = useIssueFilter();
  const { loader, issues, error, fetchPublicIssues } = useIssue();
  const issueDetailStore = useIssueDetails();
  const { data: currentUser, fetchCurrentUser } = useUser();

  useSWR(
    workspaceSlug && projectId ? "WORKSPACE_PROJECT_SETTINGS" : null,
    workspaceSlug && projectId ? () => fetchProjectSettings(workspaceSlug, projectId) : null
  );
  useSWR(
    (workspaceSlug && projectId) || states || priority || labels ? "WORKSPACE_PROJECT_PUBLIC_ISSUES" : null,
    (workspaceSlug && projectId) || states || priority || labels
      ? () => fetchPublicIssues(workspaceSlug, projectId, { states, priority, labels })
      : null
  );
  useSWR(
    workspaceSlug && projectId && !currentUser ? "WORKSPACE_PROJECT_CURRENT_USER" : null,
    workspaceSlug && projectId && !currentUser ? () => fetchCurrentUser() : null
  );

  useEffect(() => {
    if (peekId && workspaceSlug && projectId) {
      issueDetailStore.setPeekId(peekId.toString());
    }
  }, [peekId, issueDetailStore, projectId, workspaceSlug]);

  // derived values
  const activeLayout = issueFilters?.display_filters?.layout || undefined;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {workspaceSlug && projectId && peekId && (
        <IssuePeekOverview workspaceSlug={workspaceSlug} projectId={projectId} peekId={peekId} />
      )}

      {loader && !issues ? (
        <div className="py-10 text-center text-sm text-custom-text-100">Loading...</div>
      ) : (
        <>
          {error ? (
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
            activeLayout && (
              <div className="relative flex h-full w-full flex-col overflow-hidden">
                {/* applied filters */}
                <IssueAppliedFilters workspaceSlug={workspaceSlug} projectId={projectId} />

                {activeLayout === "list" && (
                  <div className="relative h-full w-full overflow-y-auto">
                    <IssueListView workspaceSlug={workspaceSlug} projectId={projectId} />
                  </div>
                )}
                {activeLayout === "kanban" && (
                  <div className="relative mx-auto h-full w-full p-5">
                    <IssueKanbanView workspaceSlug={workspaceSlug} projectId={projectId} />
                  </div>
                )}
                {activeLayout === "calendar" && <IssueCalendarView />}
                {activeLayout === "spreadsheet" && <IssueSpreadsheetView />}
                {activeLayout === "gantt" && <IssueGanttView />}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
});
