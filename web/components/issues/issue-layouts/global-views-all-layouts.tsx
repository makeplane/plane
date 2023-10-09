import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { SpreadsheetView } from "components/core";
import { AppliedFiltersList } from "components/issues";
// fetch-keys
import { GLOBAL_VIEW_ISSUES } from "constants/fetch-keys";

export const GlobalViewsAllLayouts: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query;

  const {
    globalViews: globalViewsStore,
    globalViewIssues: globalViewIssuesStore,
    workspaceFilter: workspaceFilterStore,
    workspace: workspaceStore,
  } = useMobxStore();

  const viewDetails = globalViewId ? globalViewsStore.globalViewDetails[globalViewId.toString()] : undefined;

  useSWR(
    workspaceSlug && globalViewId && viewDetails ? GLOBAL_VIEW_ISSUES(globalViewId.toString(), {}) : null,
    workspaceSlug && globalViewId && viewDetails
      ? () =>
          globalViewIssuesStore.fetchViewIssues(
            workspaceSlug.toString(),
            globalViewId.toString(),
            viewDetails.query_data.filters
          )
      : null
  );

  return (
    <div className="relative w-full h-full flex flex-col overflow-auto">
      {viewDetails && (
        <div className="p-4">
          <AppliedFiltersList
            appliedFilters={viewDetails.query_data.filters ?? {}}
            handleClearAllFilters={() => {}}
            handleRemoveFilter={() => {}}
            labels={workspaceStore.workspaceLabels}
            members={undefined}
            states={undefined}
          />
        </div>
      )}
      <div className="h-full w-full">
        <SpreadsheetView
          displayProperties={workspaceFilterStore.workspaceDisplayProperties}
          displayFilters={workspaceFilterStore.workspaceDisplayFilters}
          handleDisplayFilterUpdate={() => {}}
          issues={globalViewId ? globalViewIssuesStore.viewIssues?.[globalViewId.toString()] : undefined}
          handleIssueAction={() => {}}
          handleUpdateIssue={() => {}}
          disableUserActions={false}
        />
      </div>
    </div>
  );
});
