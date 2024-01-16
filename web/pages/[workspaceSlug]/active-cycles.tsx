import { ReactElement } from "react";
// components
import { WorkspaceActiveCyclesList } from "components/workspace";
import { WorkspaceActiveCycleHeader } from "components/headers";
// layouts
import { AppLayout } from "layouts/app-layout";
// types
import { NextPageWithLayout } from "lib/types";

const WorkspaceActiveCyclesPage: NextPageWithLayout = () => <WorkspaceActiveCyclesList />;

WorkspaceActiveCyclesPage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<WorkspaceActiveCycleHeader />}>{page}</AppLayout>;
};

export default WorkspaceActiveCyclesPage;
