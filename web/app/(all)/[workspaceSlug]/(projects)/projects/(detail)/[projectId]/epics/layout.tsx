"use client";

import { ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
// hooks
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
import { useProject, useUserPermissions } from "@/hooks/store";
// plane web components
import { EpicsEmptyState } from "@/plane-web/components/epics";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";

const EpicsLayout = observer(({ children }: { children: ReactNode }) => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { getProjectById } = useProject();
  const { getProjectFeatures } = useProjectAdvanced();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const project = getProjectById(projectId?.toString());
  const projectFeatures = getProjectFeatures(projectId?.toString());
  const isEpicsEnabled = projectFeatures?.is_epic_enabled;

  const pageTitle = project?.name ? `${project?.name} - Epics` : undefined;

  if (project && !isEpicsEnabled)
    return (
      <div className="flex items-center justify-center h-full w-full">
        <EpicsEmptyState
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          className="items-center"
          redirect
        />
      </div>
    );

  const isAuthorized = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  if (!isAuthorized) {
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="flex size-full items-center justify-center">
          <NotAuthorizedView isProjectView />;
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead title={pageTitle} />
      {children}
    </>
  );
});

export default EpicsLayout;
