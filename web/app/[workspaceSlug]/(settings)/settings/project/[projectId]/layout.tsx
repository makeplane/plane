"use client";

import { ReactNode } from "react";
import { useParams, usePathname } from "next/navigation";
// components
import { CommandPalette } from "@/components/command-palette";
import { SettingsContentWrapper } from "@/components/settings";
import { ProjectSettingsSidebar } from "@/components/settings/project/sidebar";
import { ProjectAuthWrapper } from "@/plane-web/layouts/project-wrapper";

type Props = {
  children: ReactNode;
};

export default function ProjectSettingsLayout(props: Props) {
  const { children } = props;
  // router
  const pathname = usePathname();
  const { workspaceSlug, projectId } = useParams();

  return (
    <>
      <CommandPalette />
      <ProjectAuthWrapper workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()}>
        <div className="relative flex h-full w-full">
          <ProjectSettingsSidebar workspaceSlug={workspaceSlug.toString()} pathname={pathname} />
          <SettingsContentWrapper>{children}</SettingsContentWrapper>
        </div>
      </ProjectAuthWrapper>
    </>
  );
}
