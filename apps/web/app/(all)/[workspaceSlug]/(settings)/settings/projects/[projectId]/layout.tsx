import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { Outlet } from "react-router";
// components
import { getProjectActivePath } from "@/components/settings/helper";
import { SettingsMobileNav } from "@/components/settings/mobile/nav";
// plane web imports
import { ProjectAuthWrapper } from "@/plane-web/layouts/project-wrapper";
// types
import type { Route } from "./+types/layout";
import { ProjectSettingsSidebarRoot } from "@/components/settings/project/sidebar";

function ProjectDetailSettingsLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  // router
  const pathname = usePathname();

  return (
    <>
      <SettingsMobileNav
        hamburgerContent={(props) => <ProjectSettingsSidebarRoot {...props} projectId={projectId} />}
        activePath={getProjectActivePath(pathname) || ""}
      />
      <div className="inset-y-0 flex flex-row w-full h-full">
        <div className="relative flex size-full">
          <div className="shrink-0 h-full hidden md:block">
            <ProjectSettingsSidebarRoot projectId={projectId} />
          </div>
          <ProjectAuthWrapper workspaceSlug={workspaceSlug} projectId={projectId}>
            <Outlet />
          </ProjectAuthWrapper>
        </div>
      </div>
    </>
  );
}

export default observer(ProjectDetailSettingsLayout);
