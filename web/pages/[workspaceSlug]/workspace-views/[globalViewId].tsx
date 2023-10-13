import { useRouter } from "next/router";
import useSWR from "swr";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { GlobalViewsHeader } from "components/workspace";
import { GlobalViewLayoutRoot } from "components/issues";
import { GlobalIssuesHeader } from "components/headers";
// types
import { NextPage } from "next";

const GlobalViewIssues: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query;

  const { globalViews: globalViewsStore } = useMobxStore();

  useSWR(
    workspaceSlug && globalViewId ? `GLOBAL_VIEW_DETAILS_${globalViewId.toString()}` : null,
    workspaceSlug && globalViewId
      ? () => globalViewsStore.fetchGlobalViewDetails(workspaceSlug.toString(), globalViewId.toString())
      : null
  );

  return (
    <AppLayout header={<GlobalIssuesHeader activeLayout="spreadsheet" />}>
      <div className="h-full overflow-hidden bg-custom-background-100">
        <div className="h-full w-full flex flex-col border-b border-custom-border-300">
          <GlobalViewsHeader />
          <GlobalViewLayoutRoot />
        </div>
      </div>
    </AppLayout>
  );
};

export default GlobalViewIssues;
