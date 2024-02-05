import { ReactElement } from "react";
import { useRouter } from "next/router";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
// import { GlobalViewsHeader } from "components/workspace";
// import { AllIssueLayoutRoot } from "components/issues";
// import { GlobalIssuesHeader } from "components/headers";
import { AllIssuesViewRoot } from "components/view";
// types
import { NextPageWithLayout } from "lib/types";

const GlobalViewIssuesPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { workspaceSlug, globalViewId: viewId } = router.query;

  if (!workspaceSlug || !viewId) return <></>;
  return (
    <div className="h-full overflow-hidden bg-custom-background-100">
      <div className="flex h-full w-full flex-col border-b border-custom-border-300">
        <AllIssuesViewRoot workspaceSlug={workspaceSlug.toString()} projectId={undefined} viewId={viewId.toString()} />
        {/* <GlobalViewsHeader />
        <AllIssueLayoutRoot /> */}
      </div>
    </div>
  );
};

GlobalViewIssuesPage.getLayout = function getLayout(page: ReactElement) {
  // return <AppLayout header={<GlobalIssuesHeader activeLayout="spreadsheet" />}>{page}</AppLayout>;
  return <AppLayout header={<></>}>{page}</AppLayout>;
};

export default GlobalViewIssuesPage;
