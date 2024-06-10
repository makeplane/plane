"use client";

import { observer } from "mobx-react";
// components
import { AppPageWrapper } from "@/components/app";
import { PageHead, AppHeader } from "@/components/core";
import { WorkspaceDashboardView } from "@/components/page-views";
// hooks
import { useWorkspace } from "@/hooks/store";
// local components
import WorkspaceDashboardHeader from "./header";

const WorkspaceDashboardPage = observer(() => {
  const { currentWorkspace } = useWorkspace();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Home` : undefined;

  return (
    <>
      <AppHeader header={<WorkspaceDashboardHeader />} />
      <AppPageWrapper>
        <PageHead title={pageTitle} />
        <WorkspaceDashboardView />
      </AppPageWrapper>
    </>
  );
});

export default WorkspaceDashboardPage;
