"use client";

import { ReactNode, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
// components
import { CommandPalette } from "@/components/command-palette";
import { SettingsContentWrapper } from "@/components/settings";
import { ProjectSettingsSidebar } from "@/components/settings/project/sidebar";
import { useProject } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { ProjectAuthWrapper } from "@/plane-web/layouts/project-wrapper";

type Props = {
  children: ReactNode;
};

const ProjectSettingsLayout = observer((props: Props) => {
  const { children } = props;
  // router
  const router = useAppRouter();
  const pathname = usePathname();
  const { workspaceSlug, projectId } = useParams();
  const { joinedProjectIds } = useProject();

  useEffect(() => {
    if (projectId) return;
    if (joinedProjectIds.length > 0) {
      router.push(`/${workspaceSlug}/settings/project/${joinedProjectIds[0]}`);
    }
  }, [joinedProjectIds, router, workspaceSlug, projectId]);

  return (
    <>
      <CommandPalette />
      <ProjectAuthWrapper workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()}>
        <div className="relative flex h-full w-full">
          {projectId && <ProjectSettingsSidebar workspaceSlug={workspaceSlug.toString()} pathname={pathname} />}
          <SettingsContentWrapper>{children}</SettingsContentWrapper>
        </div>
      </ProjectAuthWrapper>
    </>
  );
});

export default ProjectSettingsLayout;
