import { ReactElement } from "react";
// components
import { WorkspaceActiveCycleHeader } from "components/headers";
import { WorkspaceActiveCyclesUpgrade } from "components/workspace";
// layouts
import { AppLayout } from "layouts/app-layout";
// types
import { NextPageWithLayout } from "lib/types";

const WorkspaceActiveCyclesPage: NextPageWithLayout = () => <WorkspaceActiveCyclesUpgrade />;

WorkspaceActiveCyclesPage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<WorkspaceActiveCycleHeader />}>{page}</AppLayout>;
};

export default WorkspaceActiveCyclesPage;
