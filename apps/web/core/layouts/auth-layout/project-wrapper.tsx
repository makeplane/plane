"use client";

import { FC, ReactNode, useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, PROJECT_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EProjectNetwork } from "@plane/types";
// components
import { JoinProject } from "@/components/auth-screens";
import { LogoSpinner } from "@/components/common";
import { ComicBoxButton, DetailedEmptyState } from "@/components/empty-state";
import { ETimeLineTypeType } from "@/components/gantt-chart/contexts";
import { captureClick } from "@/helpers/event-tracker.helper";
// hooks
import {
  useCommandPalette,
  useCycle,
  useLabel,
  useMember,
  useModule,
  useProject,
  useProjectEstimates,
  useProjectState,
  useProjectView,
  useUserPermissions,
} from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { useTimeLineChart } from "@/hooks/use-timeline-chart";
// local
import { persistence } from "@/local-db/storage.sqlite";
// plane web constants

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
  const { fetchUserProjectInfo, allowPermissions, getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();
  const { loader, getProjectById, fetchProjectDetails } = useProject();
  const { fetchAllCycles } = useCycle();
  const { fetchModulesSlim, fetchModules } = useModule();
  const { initGantt } = useTimeLineChart(ETimeLineTypeType.MODULE);
  const { fetchViews } = useProjectView();
  const {
    project: { fetchProjectMembers },
  } = useMember();
  const { fetchProjectStates } = useProjectState();
  const { fetchProjectLabels } = useLabel();
  const { getProjectEstimates } = useProjectEstimates();

  // helper hooks
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/onboarding/projects" });

  // derived values
  const projectExists = projectId ? getProjectById(projectId.toString()) : null;
  const projectMemberInfo = getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId);
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

  useSWR(
    workspaceSlug && projectId ? `PROJECT_SYNC_ISSUES_${workspaceSlug.toString()}_${projectId.toString()}` : null,
    workspaceSlug && projectId
      ? () => {
          persistence.syncIssues(projectId.toString());
        }
      : null,
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 5 * 60 * 1000,
    }
  );

  // fetching project details
  useSWR(
    workspaceSlug && projectId ? `PROJECT_DETAILS_${workspaceSlug.toString()}_${projectId.toString()}` : null,
    workspaceSlug && projectId ? () => fetchProjectDetails(workspaceSlug.toString(), projectId.toString()) : null
  );

  // fetching user project member information
  useSWR(
    workspaceSlug && projectId ? `PROJECT_ME_INFORMATION_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchUserProjectInfo(workspaceSlug.toString(), projectId.toString()) : null
  );
  // fetching project labels
  useSWR(
    workspaceSlug && projectId ? `PROJECT_LABELS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchProjectLabels(workspaceSlug.toString(), projectId.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project members
  useSWR(
    workspaceSlug && projectId ? `PROJECT_MEMBERS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchProjectMembers(workspaceSlug.toString(), projectId.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project states
  useSWR(
    workspaceSlug && projectId ? `PROJECT_STATES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchProjectStates(workspaceSlug.toString(), projectId.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project estimates
  useSWR(
    workspaceSlug && projectId ? `PROJECT_ESTIMATES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => getProjectEstimates(workspaceSlug.toString(), projectId.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project cycles
  useSWR(
    workspaceSlug && projectId ? `PROJECT_ALL_CYCLES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchAllCycles(workspaceSlug.toString(), projectId.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project modules
  useSWR(
    workspaceSlug && projectId ? `PROJECT_MODULES_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId
      ? async () => {
          await fetchModulesSlim(workspaceSlug.toString(), projectId.toString());
          await fetchModules(workspaceSlug.toString(), projectId.toString());
        }
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project views
  useSWR(
    workspaceSlug && projectId ? `PROJECT_VIEWS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchViews(workspaceSlug.toString(), projectId.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // permissions
  const canPerformEmptyStateActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  // check if the project member apis is loading
  if (isParentLoading || (!projectMemberInfo && projectId && hasPermissionToCurrentProject === null))
    return (
      <div className="grid h-full place-items-center bg-custom-background-100 p-4 rounded-lg border border-custom-border-200">
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
    return <JoinProject projectId={projectId} />;

  // check if the project info is not found.
  if (loader === "loaded" && projectId && !!hasPermissionToCurrentProject === false)
    return (
      <div className="grid h-full place-items-center bg-custom-background-100">
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
                toggleCreateProjectModal(true);
                captureClick({ elementName: PROJECT_TRACKER_ELEMENTS.EMPTY_STATE_CREATE_PROJECT_BUTTON });
              }}
              disabled={!canPerformEmptyStateActions}
            />
          }
        />
      </div>
    );

  return <>{children}</>;
});
