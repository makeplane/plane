"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
// components
import { getProjectActivePath } from "@/components/settings/helper";
import { SettingsMobileNav } from "@/components/settings/mobile";
import { ProjectSettingsSidebar } from "@/components/settings/project/sidebar";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { ProjectAuthWrapper } from "@/plane-web/layouts/project-wrapper";

type ProjectSettingsLayoutProps = {
  children: ReactNode;
  params: {
    workspaceSlug: string;
    projectId?: string;
  };
};

function ProjectSettingsLayout({ children, params }: ProjectSettingsLayoutProps) {
  const { workspaceSlug, projectId } = params;
  // router
  const router = useAppRouter();
  const pathname = usePathname();
  const { joinedProjectIds } = useProject();

  useEffect(() => {
    if (projectId) return;
    if (joinedProjectIds.length > 0) {
      router.push(`/${workspaceSlug}/settings/projects/${joinedProjectIds[0]}`);
    }
  }, [joinedProjectIds, router, workspaceSlug, projectId]);

  return (
    <>
      <SettingsMobileNav hamburgerContent={ProjectSettingsSidebar} activePath={getProjectActivePath(pathname) || ""} />
      {projectId ? (
        <ProjectAuthWrapper workspaceSlug={workspaceSlug} projectId={projectId}>
          <div className="relative flex h-full w-full">
            <div className="hidden md:block">
              <ProjectSettingsSidebar />
            </div>
            <div className="w-full h-full overflow-y-scroll md:pt-page-y">{children}</div>
          </div>
        </ProjectAuthWrapper>
      ) : (
        <div className="relative flex h-full w-full">
          <div className="w-full h-full overflow-y-scroll md:pt-page-y">{children}</div>
        </div>
      )}
    </>
  );
}

export default observer(ProjectSettingsLayout);
