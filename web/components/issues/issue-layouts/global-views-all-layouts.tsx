import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// fetch-keys
import { GLOBAL_VIEW_ISSUES } from "constants/fetch-keys";

export const GlobalViewsAllLayouts: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query;

  const { globalViews: globalViewsStore, globalViewIssues: globalViewIssuesStore } = useMobxStore();

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
      <div className="h-full w-full">Global views all issues</div>
    </div>
  );
});
