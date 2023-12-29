import { ReactElement } from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { GlobalViewsHeader } from "components/workspace";
import { GlobalIssuesHeader } from "components/headers";
import { AllIssueLayoutRoot } from "components/issues";
// types
import { NextPageWithLayout } from "lib/types";

const GlobalViewSubscribedIssuesPage: NextPageWithLayout = () => (
  <div className="h-full overflow-hidden bg-custom-background-100">
    <div className="flex h-full w-full flex-col border-b border-custom-border-300">
      <GlobalViewsHeader />
      <AllIssueLayoutRoot type="subscribed" />
    </div>
  </div>
);

GlobalViewSubscribedIssuesPage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<GlobalIssuesHeader activeLayout="spreadsheet" />}>{page}</AppLayout>;
};

export default GlobalViewSubscribedIssuesPage;
