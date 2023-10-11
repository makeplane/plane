import type { NextPage } from "next";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { WorkspaceDashboardView } from "components/views";
import { WorkspaceDashboardHeader } from "components/headers/workspace-dashboard";

const WorkspacePage: NextPage = () => (
  <AppLayout header={<WorkspaceDashboardHeader />}>
    <WorkspaceDashboardView />
  </AppLayout>
);

export default WorkspacePage;
