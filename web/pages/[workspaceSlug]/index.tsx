import { ReactElement } from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { WorkspaceDashboardView } from "components/views";
import { WorkspaceDashboardHeader } from "components/headers/workspace-dashboard";
// types
import { NextPageWithLayout } from "types/app";

const WorkspacePage: NextPageWithLayout = () => <WorkspaceDashboardView />;

WorkspacePage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<WorkspaceDashboardHeader />}>{page}</AppLayout>;
};

export default WorkspacePage;
