import { ReactElement } from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { GlobalViewsHeader } from "components/workspace";
import { AllIssueLayoutRoot } from "components/issues";
import { GlobalIssuesHeader } from "components/headers";
// types
import { NextPageWithLayout } from "lib/types";

const GlobalViewIssuesPage: NextPageWithLayout = () => (
  <div className="h-full overflow-hidden bg-neutral-component-surface-light">
    <div className="flex h-full w-full flex-col border-b border-neutral-border-medium">
      <GlobalViewsHeader />
      <AllIssueLayoutRoot />
    </div>
  </div>
);

GlobalViewIssuesPage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<GlobalIssuesHeader activeLayout="spreadsheet" />}>{page}</AppLayout>;
};

export default GlobalViewIssuesPage;
