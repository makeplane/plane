import { ReactElement } from "react";
// components
import { GlobalViewsHeader } from "components/workspace";
import { GlobalIssuesHeader } from "components/headers";
import { GlobalViewLayoutRoot } from "components/issues";
// layouts
import { AppLayout } from "layouts/app-layout";
// types
import { NextPageWithLayout } from "types/app";

const GlobalViewAllIssuesPage: NextPageWithLayout = () => (
  <div className="h-full overflow-hidden bg-custom-background-100">
    <div className="h-full w-full flex flex-col border-b border-custom-border-300">
      <GlobalViewsHeader />
      <GlobalViewLayoutRoot type="all-issues" />
    </div>
  </div>
);

GlobalViewAllIssuesPage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<GlobalIssuesHeader activeLayout="spreadsheet" />}>{page}</AppLayout>;
};

export default GlobalViewAllIssuesPage;
