"use client";

import { FC, ReactNode, useEffect } from "react";
import { observer } from "mobx-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { EProjectNetwork } from "@plane/types/src/enums";
import { JoinProject } from "@/components/auth-screens";
import { LogoSpinner } from "@/components/common";
import { ComicBoxButton, DetailedEmptyState } from "@/components/empty-state";
import { ETimeLineTypeType } from "@/components/gantt-chart/contexts";
// hooks
import { useCommandPalette, useEventTracker, useProject, useUserPermissions } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { useTimeLineChart } from "@/hooks/use-timeline-chart";

interface IProjectAuthWrapper {
  workspaceSlug: string;
  projectId: string;
  children: ReactNode;
  isLoading?: boolean;
}

export const ProjectAuthWrapper: FC<IProjectAuthWrapper> = observer((props) => {
  const { workspaceSlug, projectId, children, isLoading: isParentLoading = false } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { toggleCreateProjectModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const { allowPermissions, projectUserInfo } = useUserPermissions();
  const { loader, getProjectById } = useProject();
  const { initGantt } = useTimeLineChart(ETimeLineTypeType.MODULE);

  // helper hooks
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/onboarding/projects" });

  // derived values
  const projectExists = projectId ? getProjectById(projectId.toString()) : null;
  const projectMemberInfo = projectUserInfo?.[workspaceSlug?.toString()]?.[projectId?.toString()];
  const hasPermissionToCurrentProject = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug.toString(),
    projectId?.toString()
  );
  const isWorkspaceAdmin = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug.toString()
  );

  // Initialize module timeline chart
  useEffect(() => {
    initGantt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // permissions
  const canPerformEmptyStateActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  // check if the project member apis is loading
  if (isParentLoading || (!projectMemberInfo && projectId && hasPermissionToCurrentProject === null))
    return (
      <div className="grid h-screen place-items-center bg-custom-background-100 p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <LogoSpinner />
        </div>
      </div>
    );

  // check if the user don't have permission to access the project
  if (
    ((projectExists?.network && projectExists?.network !== EProjectNetwork.PRIVATE) || isWorkspaceAdmin) &&
    projectId &&
    hasPermissionToCurrentProject === false
  )
    return <JoinProject />;

  // check if the project info is not found.
  if (loader === "loaded" && projectId && !!hasPermissionToCurrentProject === false)
    return (
      <div className="grid h-screen place-items-center bg-custom-background-100">
        <DetailedEmptyState
          title={t("workspace_projects.empty_state.general.title")}
          description={t("workspace_projects.empty_state.general.description")}
          assetPath={resolvedPath}
          customPrimaryButton={
            <ComicBoxButton
              label={t("workspace_projects.empty_state.general.primary_button.text")}
              title={t("workspace_projects.empty_state.general.primary_button.comic.title")}
              description={t("workspace_projects.empty_state.general.primary_button.comic.description")}
              onClick={() => {
                setTrackElement("Project empty state");
                toggleCreateProjectModal(true);
              }}
              disabled={!canPerformEmptyStateActions}
            />
          }
        />
      </div>
    );

  return <>{children}</>;
});
