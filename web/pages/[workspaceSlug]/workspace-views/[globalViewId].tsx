import { ReactElement } from "react";
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
import { NextPageWithLayout } from "types/app";

const GlobalViewIssuesPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query;

  const {
    globalViews: { fetchGlobalViewDetails },
  } = useMobxStore();

  useSWR(
    workspaceSlug && globalViewId ? `GLOBAL_VIEW_DETAILS_${globalViewId.toString()}` : null,
    workspaceSlug && globalViewId
      ? () => fetchGlobalViewDetails(workspaceSlug.toString(), globalViewId.toString())
      : null
  );

  return (
    <div className="h-full overflow-hidden bg-custom-background-100">
      <div className="h-full w-full flex flex-col border-b border-custom-border-300">
        <GlobalViewsHeader />
        <GlobalViewLayoutRoot />
      </div>
    </div>
  );
};

GlobalViewIssuesPage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<GlobalIssuesHeader activeLayout="spreadsheet" />}>{page}</AppLayout>;
};

export default GlobalViewIssuesPage;
