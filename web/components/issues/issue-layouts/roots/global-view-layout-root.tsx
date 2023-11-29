import React, { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { GlobalViewEmptyState, GlobalViewsAppliedFiltersRoot, SpreadsheetView } from "components/issues";
// ui
import { Spinner } from "@plane/ui";
// types
import { IIssue, IIssueDisplayFilterOptions, TStaticViewTypes } from "types";

type Props = {
  type?: TStaticViewTypes | null;
};

export const GlobalViewLayoutRoot: React.FC<Props> = observer((props) => {
  const { type = null } = props;

  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query as { workspaceSlug: string; globalViewId: string };

  const currentIssueView = type ?? globalViewId;

  const {
    globalViews: globalViewsStore,
    globalViewIssues: globalViewIssuesStore,
    globalViewFilters: globalViewFiltersStore,
    workspaceFilter: workspaceFilterStore,
    workspace: workspaceStore,
    workspaceMember: { workspaceMembers },
    issueDetail: issueDetailStore,
    project: { workspaceProjects },

    workspaceGlobalIssues: { loader, getIssues, fetchIssues },
    workspaceGlobalIssuesFilter: { issueFilters, fetchFilters },
  } = useMobxStore();

  useSWR(workspaceSlug && currentIssueView ? `WORKSPACE_GLOBAL_VIEW_ISSUES_${currentIssueView}` : null, async () => {
    if (workspaceSlug && currentIssueView) {
      await fetchFilters(workspaceSlug, currentIssueView);
      // await fetchIssues(workspaceSlug, getIssues ? "mutation" : "init-loader");
    }
  });

  // const handleDisplayFiltersUpdate = useCallback(
  //   (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
  //     if (!workspaceSlug) return;

  //     workspaceFilterStore.updateWorkspaceFilters(workspaceSlug.toString(), {
  //       display_filters: updatedDisplayFilter,
  //     });
  //   },
  //   [workspaceFilterStore, workspaceSlug]
  // );

  // const handleUpdateIssue = useCallback(
  //   (issue: IIssue, data: Partial<IIssue>) => {
  //     if (!workspaceSlug) return;

  //     const payload = {
  //       ...issue,
  //       ...data,
  //     };

  //     globalViewIssuesStore.updateIssueStructure(type ?? globalViewId!.toString(), payload);
  //     issueDetailStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, data);
  //   },
  //   [globalViewId, globalViewIssuesStore, workspaceSlug, issueDetailStore]
  // );

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <GlobalViewsAppliedFiltersRoot />

      {/* {issues?.length === 0 || !projects || projects?.length === 0 ? (
        <GlobalViewEmptyState />
      ) : (
        <div className="h-full w-full overflow-auto">
          <SpreadsheetView
            displayProperties={workspaceFilterStore.workspaceDisplayProperties}
            displayFilters={workspaceFilterStore.workspaceDisplayFilters}
            handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
            issues={issues}
            members={workspaceMembers?.map((m) => m.member)}
            labels={workspaceStore.workspaceLabels ? workspaceStore.workspaceLabels : undefined}
            disableUserActions={false}
          />
        </div>
      )} */}
    </div>
  );
});
