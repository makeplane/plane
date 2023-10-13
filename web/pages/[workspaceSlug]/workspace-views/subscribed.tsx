// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { GlobalViewsHeader } from "components/workspace";
import { GlobalIssuesHeader } from "components/headers";
import { GlobalViewLayoutRoot } from "components/issues";
// types
import { NextPage } from "next";

const GlobalViewSubscribedIssues: NextPage = () => (
  <AppLayout header={<GlobalIssuesHeader activeLayout="spreadsheet" />}>
    <div className="h-full overflow-hidden bg-custom-background-100">
      <div className="h-full w-full flex flex-col border-b border-custom-border-300">
        <GlobalViewsHeader />
        <GlobalViewLayoutRoot type="subscribed" />
      </div>
    </div>
  </AppLayout>
);

export default GlobalViewSubscribedIssues;
