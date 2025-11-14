"use client";

import type { FC, ReactNode } from "react";
import { useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, PROJECT_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { EProjectNetwork, GANTT_TIMELINE_TYPE } from "@plane/types";
// components
import { JoinProject } from "@/components/auth-screens/project/join-project";
import { LogoSpinner } from "@/components/common/logo-spinner";
import {
  PROJECT_DETAILS,
  PROJECT_ME_INFORMATION,
  PROJECT_LABELS,
  PROJECT_MEMBERS,
  PROJECT_STATES,
  PROJECT_ESTIMATES,
  PROJECT_ALL_CYCLES,
  PROJECT_MODULES,
  PROJECT_VIEWS,
} from "@/constants/fetch-keys";
import { captureClick } from "@/helpers/event-tracker.helper";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useCycle } from "@/hooks/store/use-cycle";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useProjectView } from "@/hooks/store/use-project-view";
import { useUserPermissions } from "@/hooks/store/user";
import { useTimeLineChart } from "@/hooks/use-timeline-chart";

interface IProjectAuthWrapper {
  workspaceSlug: string;
  projectId?: string;
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
  const { initGantt } = useTimeLineChart(GANTT_TIMELINE_TYPE.MODULE);
  const { fetchViews } = useProjectView();
  const {
    project: { fetchProjectMembers },
  } = useMember();
  const { fetchProjectStates } = useProjectState();
  const { fetchProjectLabels } = useLabel();
  const { getProjectEstimates } = useProjectEstimates();

  // derived values
  const projectExists = projectId ? getProjectById(projectId) : null;
  const projectMemberInfo = getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId);
  const hasPermissionToCurrentProject = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );
  const isWorkspaceAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE, workspaceSlug);

  // Initialize module timeline chart
  useEffect(() => {
    initGantt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fetching project details
  useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(workspaceSlug, projectId) : null,
    workspaceSlug && projectId ? () => fetchProjectDetails(workspaceSlug, projectId) : null
  );

  // fetching user project member information
  useSWR(
    workspaceSlug && projectId ? PROJECT_ME_INFORMATION(workspaceSlug, projectId) : null,
    workspaceSlug && projectId ? () => fetchUserProjectInfo(workspaceSlug, projectId) : null
  );
  // fetching project labels
  useSWR(
    workspaceSlug && projectId ? PROJECT_LABELS(workspaceSlug, projectId) : null,
    workspaceSlug && projectId ? () => fetchProjectLabels(workspaceSlug, projectId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project members
  useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(workspaceSlug, projectId) : null,
    workspaceSlug && projectId ? () => fetchProjectMembers(workspaceSlug, projectId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project states
  useSWR(
    workspaceSlug && projectId ? PROJECT_STATES(workspaceSlug, projectId) : null,
    workspaceSlug && projectId ? () => fetchProjectStates(workspaceSlug, projectId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project estimates
  useSWR(
    workspaceSlug && projectId ? PROJECT_ESTIMATES(workspaceSlug, projectId) : null,
    workspaceSlug && projectId ? () => getProjectEstimates(workspaceSlug, projectId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project cycles
  useSWR(
    workspaceSlug && projectId ? PROJECT_ALL_CYCLES(workspaceSlug, projectId) : null,
    workspaceSlug && projectId ? () => fetchAllCycles(workspaceSlug, projectId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project modules
  useSWR(
    workspaceSlug && projectId ? PROJECT_MODULES(workspaceSlug, projectId) : null,
    workspaceSlug && projectId
      ? async () => {
          await fetchModulesSlim(workspaceSlug, projectId);
          await fetchModules(workspaceSlug, projectId);
        }
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project views
  useSWR(
    workspaceSlug && projectId ? PROJECT_VIEWS(workspaceSlug, projectId) : null,
    workspaceSlug && projectId ? () => fetchViews(workspaceSlug, projectId) : null,
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
        <EmptyStateDetailed
          title={t("workspace_projects.empty_state.general.title")}
          description={t("workspace_projects.empty_state.general.description")}
          assetKey="project"
          assetClassName="size-40"
          actions={[
            {
              label: t("workspace_projects.empty_state.general.primary_button.text"),
              onClick: () => {
                toggleCreateProjectModal(true);
                captureClick({ elementName: PROJECT_TRACKER_ELEMENTS.EMPTY_STATE_CREATE_PROJECT_BUTTON });
              },
              disabled: !canPerformEmptyStateActions,
              variant: "primary",
            },
          ]}
        />
      </div>
    );

  return <>{children}</>;
});
