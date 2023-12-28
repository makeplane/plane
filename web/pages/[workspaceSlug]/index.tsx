import { ReactElement } from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { WorkspaceDashboardView } from "components/page-views";
import { WorkspaceDashboardHeader } from "components/headers/workspace-dashboard";
// types
import { NextPageWithLayout } from "lib/types";

const WorkspacePage: NextPageWithLayout = () => <WorkspaceDashboardView />;

WorkspacePage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<WorkspaceDashboardHeader />}>{page}</AppLayout>;
};

export default WorkspacePage;
