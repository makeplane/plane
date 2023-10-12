import React, { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { SpreadsheetView } from "components/core";
import { GlobalViewsAppliedFiltersRoot } from "components/issues";
// types
import { IIssueDisplayFilterOptions, TStaticViewTypes } from "types";
// fetch-keys
import { GLOBAL_VIEW_ISSUES } from "constants/fetch-keys";

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
  } = useMobxStore();

  const viewDetails = globalViewId ? globalViewsStore.globalViewDetails[globalViewId.toString()] : undefined;

  const storedFilters = globalViewId ? globalViewFiltersStore.storedFilters[globalViewId.toString()] : undefined;

  useSWR(
    workspaceSlug && globalViewId && viewDetails ? GLOBAL_VIEW_ISSUES(globalViewId.toString()) : null,
    workspaceSlug && globalViewId && viewDetails
      ? () => {
          globalViewIssuesStore.fetchViewIssues(workspaceSlug.toString(), globalViewId.toString(), storedFilters ?? {});
        }
      : null
  );

  useSWR(
    workspaceSlug && type ? GLOBAL_VIEW_ISSUES(type) : null,
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
          handleIssueAction={() => {}}
          handleUpdateIssue={() => {}}
          disableUserActions={false}
        />
      </div>
    </div>
  );
});
