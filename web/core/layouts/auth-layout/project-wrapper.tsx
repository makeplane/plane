"use client";

import { FC, ReactNode, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";

// components
import { JoinProject } from "@/components/auth-screens";
import { LogoSpinner } from "@/components/common";
import { EmptyState } from "@/components/empty-state";
import { ETimeLineTypeType } from "@/components/gantt-chart/contexts";
//constants
import { EmptyStateType } from "@/constants/empty-state";
// hooks
import {
  useCommandPalette,
  useCycle,
  useEventTracker,
  useLabel,
  useMember,
  useModule,
  useProject,
  useProjectEstimates,
  useProjectState,
  useProjectView,
  useUserPermissions,
} from "@/hooks/store";
import { useTimeLineChart } from "@/hooks/use-timeline-chart";
// local
import { persistence } from "@/local-db/storage.sqlite";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

interface IProjectAuthWrapper {
  children: ReactNode;
}

export const ProjectAuthWrapper: FC<IProjectAuthWrapper> = observer((props) => {
  const { children } = props;
  // store
  // const { fetchInboxes } = useInbox();
  const { toggleCreateProjectModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const { fetchUserProjectInfo, allowPermissions, projectUserInfo } = useUserPermissions();
  const { loader, getProjectById, fetchProjectDetails } = useProject();
  const { fetchAllCycles } = useCycle();
  const { fetchModulesSlim, fetchModules } = useModule();
  const { initGantt } = useTimeLineChart(ETimeLineTypeType.MODULE);
  const { fetchViews } = useProjectView();
  const {
    project: { fetchProjectMembers },
  } = useMember();
  const { fetchProjectStates, fetchProjectStateTransitions } = useProjectState();
  const { fetchProjectLabels } = useLabel();
  const { getProjectEstimates } = useProjectEstimates();
  // router
  const { workspaceSlug, projectId } = useParams();

  const projectMemberInfo = projectUserInfo?.[workspaceSlug?.toString()]?.[projectId?.toString()];

  // Initialize module timeline chart
  useEffect(() => {
    initGantt();
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
    workspaceSlug && projectId
      ? () => {
          fetchProjectStates(workspaceSlug.toString(), projectId.toString());
          fetchProjectStateTransitions(workspaceSlug.toString(), projectId.toString());
        }
      : null,
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

  // derived values
  const projectExists = projectId ? getProjectById(projectId.toString()) : null;
  const hasPermissionToCurrentProject = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug.toString(),
    projectId?.toString()
  );

  // check if the project member apis is loading
  if (!projectMemberInfo && projectId && hasPermissionToCurrentProject === null)
    return (
      <div className="grid h-screen place-items-center bg-custom-background-100 p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <LogoSpinner />
        </div>
      </div>
    );

  // check if the user don't have permission to access the project
  if (projectExists && projectId && hasPermissionToCurrentProject === false) return <JoinProject />;

  // check if the project info is not found.
  if (!loader && !projectExists && projectId && !!hasPermissionToCurrentProject === false)
    return (
      <div className="grid h-screen place-items-center bg-custom-background-100">
        <EmptyState
          type={EmptyStateType.WORKSPACE_PROJECT_NOT_FOUND}
          layout="screen-detailed"
          primaryButtonOnClick={() => {
            setTrackElement("Projects page empty state");
            toggleCreateProjectModal(true);
          }}
        />
      </div>
    );

  return <>{children}</>;
});
