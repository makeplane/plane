import { ReactElement } from "react";
import { observer } from "mobx-react";
// layouts
// components
import { PageHead } from "@/components/core";
import { WorkspaceDashboardHeader } from "@/components/headers/workspace-dashboard";
import { WorkspaceDashboardView } from "@/components/page-views";
// types
// hooks
import { useWorkspace } from "@/hooks/store";
import { AppLayout } from "@/layouts/app-layout";
import { NextPageWithLayout } from "@/lib/types";

const WorkspacePage: NextPageWithLayout = observer(() => {
  const { currentWorkspace } = useWorkspace();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Home` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <WorkspaceDashboardView />
    </>
  );
});

WorkspacePage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<WorkspaceDashboardHeader />}>{page}</AppLayout>;
};

export default WorkspacePage;
