"use client";

import { observer } from "mobx-react";
// components
import { PageHead, AppHeader, ContentWrapper } from "@/components/core";
import { WorkspaceDashboardView } from "@/components/page-views";
// hooks
import { useWorkspace } from "@/hooks/store";
// local components
import { WorkspaceDashboardHeader } from "./header";

const WorkspaceDashboardPage = observer(() => {
  const { currentWorkspace } = useWorkspace();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Home` : undefined;

  return (
    <>
      <AppHeader header={<WorkspaceDashboardHeader />} />
      <ContentWrapper>
        <PageHead title={pageTitle} />
        <WorkspaceDashboardView />
      </ContentWrapper>
    </>
  );
});

export default WorkspaceDashboardPage;
