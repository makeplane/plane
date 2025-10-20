"use client";

import { observer } from "mobx-react";
// components
import { useTranslation } from "@plane/i18n";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { PageHead } from "@/components/core/page-title";
import { WorkspaceHomeView } from "@/components/home";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// local components
import { WorkspaceDashboardHeader } from "./header";
import { ProjectIssueTypeService } from "@/services/project/project-issue-type.service";
import { useEffect } from "react";

const WorkspaceDashboardPage = observer(() => {
  const { currentWorkspace } = useWorkspace();

  const { t } = useTranslation();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - ${t("home.title")}` : undefined;
  const workspaceSlug = currentWorkspace?.name || "";
  // 整个工作区加载issue type
  useEffect(() => {
    const ws = workspaceSlug?.toString();
    if (!ws) return;

    const svc = new ProjectIssueTypeService();
    svc.fetchWorkSpaceIssueTypes(ws);
  }, [workspaceSlug]);

  return (
    <>
      {/* 这个是首页顶部的面包屑和右侧的按钮 */}
      <AppHeader header={<WorkspaceDashboardHeader />} />
      <ContentWrapper>
        {/* 这里是tab页上展示的名称 */}
        <PageHead title={pageTitle} />
        <WorkspaceHomeView />
      </ContentWrapper>
    </>
  );
});

export default WorkspaceDashboardPage;
