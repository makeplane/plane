"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { Outlet } from "react-router";
// components
import { getProjectActivePath } from "@/components/settings/helper";
import { SettingsMobileNav } from "@/components/settings/mobile";
import { ProjectSettingsSidebar } from "@/components/settings/project/sidebar";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { ProjectAuthWrapper } from "@/plane-web/layouts/project-wrapper";

const ProjectSettingsLayout = observer(() => {
  // router
  const router = useAppRouter();
  const pathname = usePathname();
  const { workspaceSlug, projectId } = useParams();
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
      <ProjectAuthWrapper workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()}>
        <div className="relative flex h-full w-full">
          <div className="hidden md:block">{projectId && <ProjectSettingsSidebar />}</div>
          <div className="w-full h-full overflow-y-scroll md:pt-page-y">
            <Outlet />
          </div>
        </div>
      </ProjectAuthWrapper>
    </>
  );
});

export default ProjectSettingsLayout;
