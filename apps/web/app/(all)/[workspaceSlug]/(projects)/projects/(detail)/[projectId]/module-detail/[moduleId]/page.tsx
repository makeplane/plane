"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ModuleDetailContent } from "@/components/modules/module-detail-content";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { AppHeader } from "@/components/core/app-header";
import { Header } from "@plane/ui";
import { Breadcrumbs } from "@plane/ui";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { useModule } from "@/hooks/store/use-module";
import { useProject } from "@/hooks/store/use-project";

const ModuleDetailPage = observer(() => {
  const { workspaceSlug, projectId, moduleId } = useParams();
  const { getModuleById, fetchModuleDetails } = useModule();
  const { getProjectById } = useProject();

  useEffect(() => {
    if (workspaceSlug && projectId && moduleId) {
      fetchModuleDetails(workspaceSlug.toString(), projectId.toString(), moduleId.toString());
    }
  }, [workspaceSlug, projectId, moduleId, fetchModuleDetails]);

  const moduleDetails = moduleId ? getModuleById(moduleId.toString()) : undefined;
  const projectDetails = projectId ? getProjectById(projectId.toString()) : undefined;

  if (!moduleId || !moduleDetails) return null;

  return (
    <>
      <AppHeader
        header={
          <Header>
            <Header.LeftItem>
              <Breadcrumbs>
                <Breadcrumbs.Item
                  component={
                    <BreadcrumbLink
                      label={projectDetails?.name ?? "Project"}
                      href={`/${workspaceSlug}/projects/${projectId}/modules`}
                    />
                  }
                />
                <Breadcrumbs.Item
                  component={
                    <BreadcrumbLink label="Releases" href={`/${workspaceSlug}/projects/${projectId}/modules`} />
                  }
                />
                <Breadcrumbs.Item component={<BreadcrumbLink label={moduleDetails?.name ?? "Module Details"} />} />
              </Breadcrumbs>
            </Header.LeftItem>
          </Header>
        }
      />
      <ContentWrapper>
        <div className="max-w-[1000px] mx-auto p-8 bg-custom-background-100 min-h-full">
          <ModuleDetailContent moduleId={moduleId.toString()} />
        </div>
      </ContentWrapper>
    </>
  );
});

export default ModuleDetailPage;
