"use client";

import { observer } from "mobx-react";
// components
import { PageHead, AppHeader, ContentWrapper } from "@/components/core";
// hooks
import { useWorkspace } from "@/hooks/store";
// local components
import { HomeBase } from "@/plane-web/components/home/base";
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
        <HomeBase />
      </ContentWrapper>
    </>
  );
});

export default WorkspaceDashboardPage;
