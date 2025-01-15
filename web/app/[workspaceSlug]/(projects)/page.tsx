"use client";

import { observer } from "mobx-react";
// components
import { PageHead, AppHeader, ContentWrapper } from "@/components/core";
import { WorkspaceHomeView } from "@/components/home";
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
        <WorkspaceHomeView />
      </ContentWrapper>
    </>
  );
});

export default WorkspaceDashboardPage;
