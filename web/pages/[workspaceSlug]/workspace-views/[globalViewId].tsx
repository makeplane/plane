import { useRouter } from "next/router";
import useSWR from "swr";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout-legacy";
// components
import { GlobalViewsHeader } from "components/workspace";
import { GlobalViewsAllLayouts } from "components/issues";
import { GlobalIssuesHeader } from "components/headers";
// icons
import { CheckCircle } from "lucide-react";
// types
import { NextPage } from "next";
// fetch-keys
import { GLOBAL_VIEWS_LIST, GLOBAL_VIEW_DETAILS } from "constants/fetch-keys";

const GlobalViewIssues: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query;

  const { globalViews: globalViewsStore } = useMobxStore();

  useSWR(
    workspaceSlug ? GLOBAL_VIEWS_LIST(workspaceSlug.toString()) : null,
    workspaceSlug ? () => globalViewsStore.fetchAllGlobalViews(workspaceSlug.toString()) : null
  );

  useSWR(
    workspaceSlug && globalViewId ? GLOBAL_VIEW_DETAILS(globalViewId.toString()) : null,
    workspaceSlug && globalViewId
      ? () => globalViewsStore.fetchGlobalViewDetails(workspaceSlug.toString(), globalViewId.toString())
      : null
  );

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <div className="flex gap-2 items-center">
          <CheckCircle size={18} strokeWidth={1.5} />
          <span className="text-sm font-medium">Workspace issues</span>
        </div>
      }
      right={<GlobalIssuesHeader activeLayout="spreadsheet" />}
    >
      <div className="h-full flex flex-col overflow-hidden bg-custom-background-100">
        <div className="h-full w-full flex flex-col border-b border-custom-border-300">
          <GlobalViewsHeader />
          <GlobalViewsAllLayouts />
        </div>
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default GlobalViewIssues;
