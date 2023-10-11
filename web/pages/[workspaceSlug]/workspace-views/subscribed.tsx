import { useRouter } from "next/router";
import useSWR from "swr";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { GlobalViewsHeader } from "components/workspace";
import { GlobalIssuesHeader } from "components/headers";
import { GlobalViewsAllLayouts } from "components/issues";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout-legacy";
// icons
import { CheckCircle } from "lucide-react";
// types
import { NextPage } from "next";
// fetch-keys
import { GLOBAL_VIEWS_LIST } from "constants/fetch-keys";

const GlobalViewSubscribedIssues: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { globalViews: globalViewsStore } = useMobxStore();

  useSWR(
    workspaceSlug ? GLOBAL_VIEWS_LIST(workspaceSlug.toString()) : null,
    workspaceSlug ? () => globalViewsStore.fetchAllGlobalViews(workspaceSlug.toString()) : null
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
      <div className="h-full overflow-hidden bg-custom-background-100">
        <div className="h-full w-full flex flex-col border-b border-custom-border-300">
          <GlobalViewsHeader />
          <GlobalViewsAllLayouts type="subscribed" />
        </div>
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default GlobalViewSubscribedIssues;
