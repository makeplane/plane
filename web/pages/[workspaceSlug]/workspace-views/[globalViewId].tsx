import { ReactElement } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react";
// layouts
import { AppLayout } from "layouts/app-layout";
// hooks
import { useGlobalView, useWorkspace } from "hooks/store";
// components
import { GlobalViewsHeader } from "components/workspace";
import { AllIssueLayoutRoot } from "components/issues";
import { GlobalIssuesHeader } from "components/headers";
import { PageHead } from "components/core";
// types
import { NextPageWithLayout } from "lib/types";
// constants
import { DEFAULT_GLOBAL_VIEWS_LIST } from "constants/workspace";

const GlobalViewIssuesPage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  const { globalViewId } = router.query;
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { getViewDetailsById } = useGlobalView();
  // derived values
  const globalViewDetails = globalViewId ? getViewDetailsById(globalViewId.toString()) : undefined;
  const defaultView = DEFAULT_GLOBAL_VIEWS_LIST.find((view) => view.key === globalViewId);
  const pageTitle =
    currentWorkspace?.name && defaultView?.label
      ? `${currentWorkspace?.name} - ${defaultView?.label}`
      : currentWorkspace?.name && globalViewDetails?.name
      ? `${currentWorkspace?.name} - ${globalViewDetails?.name}`
      : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="h-full overflow-hidden bg-custom-background-100">
        <div className="flex h-full w-full flex-col border-b border-custom-border-300">
          <GlobalViewsHeader />
          <AllIssueLayoutRoot />
        </div>
      </div>
    </>
  );
});

GlobalViewIssuesPage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<GlobalIssuesHeader activeLayout="spreadsheet" />}>{page}</AppLayout>;
};

export default GlobalViewIssuesPage;
