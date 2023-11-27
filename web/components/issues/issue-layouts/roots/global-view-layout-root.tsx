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
  type?: TStaticViewTypes;
};

export const GlobalViewLayoutRoot: React.FC<Props> = observer((props) => {
  const { type } = props;

  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query;

  const {
    globalViews: globalViewsStore,
    globalViewIssues: globalViewIssuesStore,
    globalViewFilters: globalViewFiltersStore,
    workspaceFilter: workspaceFilterStore,
    workspace: workspaceStore,
    workspaceMember: { workspaceMembers },
    issueDetail: issueDetailStore,
    project: projectStore,
  } = useMobxStore();

  const viewDetails = globalViewId ? globalViewsStore.globalViewDetails[globalViewId.toString()] : undefined;

  const storedFilters = globalViewId ? globalViewFiltersStore.storedFilters[globalViewId.toString()] : undefined;

  const projects = workspaceSlug ? projectStore.projects[workspaceSlug.toString()] : null;

  useSWR(
    workspaceSlug && globalViewId && viewDetails ? `GLOBAL_VIEW_ISSUES_${globalViewId.toString()}` : null,
    workspaceSlug && globalViewId && viewDetails
      ? () => {
          globalViewIssuesStore.fetchViewIssues(workspaceSlug.toString(), globalViewId.toString(), storedFilters ?? {});
        }
      : null
  );

  useSWR(
    workspaceSlug && type ? `GLOBAL_VIEW_ISSUES_${type.toString()}` : null,
    workspaceSlug && type
      ? () => {
          globalViewIssuesStore.fetchStaticIssues(workspaceSlug.toString(), type);
        }
      : null
  );

  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug) return;

      workspaceFilterStore.updateWorkspaceFilters(workspaceSlug.toString(), {
        display_filters: updatedDisplayFilter,
      });
    },
    [workspaceFilterStore, workspaceSlug]
  );

  const handleUpdateIssue = useCallback(
    (issue: IIssue, data: Partial<IIssue>) => {
      if (!workspaceSlug) return;

      const payload = {
        ...issue,
        ...data,
      };

      globalViewIssuesStore.updateIssueStructure(type ?? globalViewId!.toString(), payload);
      issueDetailStore.updateIssue(workspaceSlug.toString(), issue.project, issue.id, data);
    },
    [globalViewId, globalViewIssuesStore, workspaceSlug, issueDetailStore]
  );

  const issues = type
    ? globalViewIssuesStore.viewIssues?.[type]
    : globalViewId
    ? globalViewIssuesStore.viewIssues?.[globalViewId.toString()]
    : undefined;

  if (!issues)
    return (
      <div className="h-full w-full grid place-items-center">
        <Spinner />
      </div>
    );

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <GlobalViewsAppliedFiltersRoot />
      {issues?.length === 0 || !projects || projects?.length === 0 ? (
        <GlobalViewEmptyState />
      ) : (
        <div className="h-full w-full overflow-auto">
          {/* <SpreadsheetView
            displayProperties={workspaceFilterStore.workspaceDisplayProperties}
            displayFilters={workspaceFilterStore.workspaceDisplayFilters}
            handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
            issues={issues}
            members={workspaceMembers?.map((m) => m.member)}
            labels={workspaceStore.workspaceLabels ? workspaceStore.workspaceLabels : undefined}
            disableUserActions={false}
          /> */}
        </div>
      )}
    </div>
  );
});
