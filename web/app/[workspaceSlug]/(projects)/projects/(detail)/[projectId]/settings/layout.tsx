"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// ui
import { Button, LayersIcon } from "@plane/ui";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { AppHeader, ContentWrapper } from "@/components/core";
// constants
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useUser } from "@/hooks/store";
// local components
import { ProjectSettingHeader } from "./header";
import { ProjectSettingsSidebar } from "./sidebar";

export interface IProjectSettingLayout {
  children: ReactNode;
}

const ProjectSettingLayout: FC<IProjectSettingLayout> = observer((props) => {
  const { children } = props;
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();

  const restrictViewSettings = currentProjectRole && currentProjectRole <= EUserProjectRoles.VIEWER;

  if (restrictViewSettings) {
    return (
      <NotAuthorizedView
        type="project"
        actionButton={
          //TODO: Create a new component called Button Link to handle such scenarios
          <Link href={`/${workspaceSlug}/projects/${projectId}/issues`}>
            <Button variant="primary" size="md" prependIcon={<LayersIcon />}>
              Go to issues
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <AppHeader header={<ProjectSettingHeader />} />
      <ContentWrapper>
        <div className="inset-y-0 z-20 flex flex-grow-0 h-full w-full">
          <div className="w-80 flex-shrink-0 overflow-y-hidden pt-8 sm:hidden hidden md:block lg:block">
            <ProjectSettingsSidebar />
          </div>
          <div className="w-full pl-10 sm:pl-10 md:pl-0 lg:pl-0 overflow-x-hidden overflow-y-scroll vertical-scrollbar scrollbar-md">
            {children}
          </div>
        </div>
      </ContentWrapper>
    </>
  );
});

export default ProjectSettingLayout;
