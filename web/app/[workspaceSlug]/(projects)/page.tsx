"use client";

import { observer } from "mobx-react";
// components
import { useTranslation } from "@plane/i18n";
import { PageHead, AppHeader, ContentWrapper } from "@/components/core";
import { WorkspaceHomeView } from "@/components/home";
// hooks
import { useWorkspace } from "@/hooks/store";
// local components
import { WorkspaceDashboardHeader } from "./header";

const WorkspaceDashboardPage = observer(() => {
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - ${t("home.title")}` : undefined;

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
