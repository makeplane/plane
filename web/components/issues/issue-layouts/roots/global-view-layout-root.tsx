import React, { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { GlobalViewsAppliedFiltersRoot, SpreadsheetView } from "components/issues";
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
  } = useMobxStore();

  const viewDetails = globalViewId ? globalViewsStore.globalViewDetails[globalViewId.toString()] : undefined;

  const storedFilters = globalViewId ? globalViewFiltersStore.storedFilters[globalViewId.toString()] : undefined;

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

      console.log("issue", issue);
      console.log("data", data);

      // TODO: add update issue logic here
    },
    [workspaceSlug]
  );

  const issues = type
    ? globalViewIssuesStore.viewIssues?.[type]
    : globalViewId
    ? globalViewIssuesStore.viewIssues?.[globalViewId.toString()]
    : undefined;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      <GlobalViewsAppliedFiltersRoot />
      <div className="h-full w-full overflow-auto">
        <SpreadsheetView
          displayProperties={workspaceFilterStore.workspaceDisplayProperties}
          displayFilters={workspaceFilterStore.workspaceDisplayFilters}
          handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
          issues={issues}
          members={workspaceStore.workspaceMembers ? workspaceStore.workspaceMembers.map((m) => m.member) : undefined}
          labels={workspaceStore.workspaceLabels ? workspaceStore.workspaceLabels : undefined}
          handleIssueAction={() => {}}
          handleUpdateIssue={handleUpdateIssue}
          disableUserActions={false}
        />
      </div>
    </div>
  );
});
