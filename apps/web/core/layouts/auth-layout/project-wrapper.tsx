import type { ReactNode } from "react";
import { useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, PROJECT_TRACKER_ELEMENTS } from "@plane/constants";
import { GANTT_TIMELINE_TYPE } from "@plane/types";
// components
import { ProjectAccessRestriction } from "@/components/auth-screens/project/access-restriction";
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
  projectId: string;
  children: ReactNode;
  isLoading?: boolean;
}

export const ProjectAuthWrapper = observer(function ProjectAuthWrapper(props: IProjectAuthWrapper) {
  const { workspaceSlug, projectId, children, isLoading: isParentLoading = false } = props;
  // store hooks
  const { toggleCreateProjectModal } = useCommandPalette();
  const { fetchUserProjectInfo, allowPermissions } = useUserPermissions();
  const { fetchProjectDetails } = useProject();
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
  const hasPermissionToCurrentProject = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );
  const canAddProject = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const isWorkspaceAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE, workspaceSlug);

  // Initialize module timeline chart
  useEffect(() => {
    initGantt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fetching project details
  const { isLoading: isProjectDetailsLoading, error: projectDetailsError } = useSWR(
    PROJECT_DETAILS(workspaceSlug, projectId),
    () => fetchProjectDetails(workspaceSlug, projectId)
  );

  // fetching user project member information
  useSWR(PROJECT_ME_INFORMATION(workspaceSlug, projectId), () => fetchUserProjectInfo(workspaceSlug, projectId));
  // fetching project labels
  useSWR(PROJECT_LABELS(workspaceSlug, projectId), () => fetchProjectLabels(workspaceSlug, projectId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });
  // fetching project members
  useSWR(PROJECT_MEMBERS(workspaceSlug, projectId), () => fetchProjectMembers(workspaceSlug, projectId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });
  // fetching project states
  useSWR(PROJECT_STATES(workspaceSlug, projectId), () => fetchProjectStates(workspaceSlug, projectId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });
  // fetching project estimates
  useSWR(PROJECT_ESTIMATES(workspaceSlug, projectId), () => getProjectEstimates(workspaceSlug, projectId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });
  // fetching project cycles
  useSWR(PROJECT_ALL_CYCLES(workspaceSlug, projectId), () => fetchAllCycles(workspaceSlug, projectId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });
  // fetching project modules
  useSWR(
    PROJECT_MODULES(workspaceSlug, projectId),
    async () => {
      await Promise.all([fetchModulesSlim(workspaceSlug, projectId), fetchModules(workspaceSlug, projectId)]);
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project views
  useSWR(PROJECT_VIEWS(workspaceSlug, projectId), () => fetchViews(workspaceSlug, projectId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });

  const isProjectLoading = (isParentLoading || isProjectDetailsLoading) && !projectDetailsError;

  if (isProjectLoading) return null;

  if (!isProjectLoading && hasPermissionToCurrentProject === false) {
    return (
      <ProjectAccessRestriction
        errorStatusCode={projectDetailsError?.status}
        isWorkspaceAdmin={isWorkspaceAdmin}
        projectId={projectId}
        handleCreateProject={() => {
          toggleCreateProjectModal(true);
          captureClick({ elementName: PROJECT_TRACKER_ELEMENTS.EMPTY_STATE_CREATE_PROJECT_BUTTON });
        }}
        canAddProject={canAddProject}
      />
    );
  }

  return <>{children}</>;
});
