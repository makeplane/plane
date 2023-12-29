import { ReactElement } from "react";
// components
import { GlobalViewsHeader } from "components/workspace";
import { GlobalIssuesHeader } from "components/headers";
import { AllIssueLayoutRoot } from "components/issues";
// layouts
import { AppLayout } from "layouts/app-layout";
// types
import { NextPageWithLayout } from "lib/types";

const GlobalViewCreatedIssuesPage: NextPageWithLayout = () => (
  <div className="h-full overflow-hidden bg-custom-background-100">
    <div className="flex h-full w-full flex-col border-b border-custom-border-300">
      <GlobalViewsHeader />
      <AllIssueLayoutRoot type="created" />
    </div>
  </div>
);

GlobalViewCreatedIssuesPage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<GlobalIssuesHeader activeLayout="spreadsheet" />}>{page}</AppLayout>;
};

export default GlobalViewCreatedIssuesPage;
