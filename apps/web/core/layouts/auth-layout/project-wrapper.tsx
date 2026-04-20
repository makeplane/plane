/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { EIssuesStoreType, GANTT_TIMELINE_TYPE } from "@plane/types";
// components
import { ProjectAccessRestriction } from "@/components/auth-screens/project/project-access-restriction";
import { ProjectLoadingSkeleton } from "@/components/ui/loader/project-loading-skeleton";
import { PROJECT_DETAILS, PROJECT_MODULES_SLIM } from "@/constants/fetch-keys";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssues } from "@/hooks/store/use-issues";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useProjectView } from "@/hooks/store/use-project-view";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { useTimeLineChart } from "@/hooks/use-timeline-chart";

interface IProjectAuthWrapper {
  workspaceSlug: string;
  projectId: string;
  children: ReactNode;
  isLoading?: boolean;
}

export const ProjectAuthWrapper = observer(function ProjectAuthWrapper(props: IProjectAuthWrapper) {
  const { workspaceSlug, projectId, children, isLoading: isParentLoading = false } = props;
  // states
  const [isJoiningProject, setIsJoiningProject] = useState(false);
  // store hooks
  const { fetchUserProjectInfo, allowPermissions, getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();
  const { fetchProjectDetails } = useProject();
  const { joinProject } = useUserPermissions();
  const { fetchAllCycles } = useCycle();
  const { fetchModulesSlim, fetchModules } = useModule();
  const { initGantt } = useTimeLineChart(GANTT_TIMELINE_TYPE.MODULE);
  const { fetchViews } = useProjectView();
  const {
    project: { fetchProjectMembers, fetchProjectUserProperties },
  } = useMember();
  const { fetchProjectStates, fetchProjectIntakeState } = useProjectState();
  const { data: currentUserData } = useUser();
  const { fetchProjectLabels } = useLabel();
  const { getProjectEstimates } = useProjectEstimates();
  const { issuesFilter } = useIssues(EIssuesStoreType.PROJECT);
  // derived values
  const hasPermissionToCurrentProject = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );
  const currentProjectRole = getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId);
  const isWorkspaceAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE, workspaceSlug);
  // Initialize module timeline chart
  useEffect(() => {
    initGantt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hydrate project from cache on mount for instant render
  useEffect(() => {
    if (projectId) {
      // Try to load from cache first while SWR fetches from server
      const { project } = useProject();
      project.hydrateProjectFromCache(projectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // fetching project details
  const { isLoading: isProjectDetailsLoading, error: projectDetailsError } = useSWR(
    PROJECT_DETAILS(workspaceSlug, projectId),
    () => fetchProjectDetails(workspaceSlug, projectId),
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // Lazy-load secondary SWRs after PROJECT_DETAILS succeeds using requestIdleCallback
  useEffect(() => {
    const isProjectReady = !isProjectDetailsLoading && !projectDetailsError;
    if (!isProjectReady) return;

    const idleCallbackId = requestIdleCallback(() => {
      // Trigger all secondary SWRs in background
      fetchUserProjectInfo(workspaceSlug, projectId);
      if (currentUserData?.id) {
        fetchProjectUserProperties(workspaceSlug, projectId);
        issuesFilter?.fetchFilters(workspaceSlug, projectId);
      }
      fetchProjectLabels(workspaceSlug, projectId);
      fetchProjectMembers(workspaceSlug, projectId);
      fetchProjectStates(workspaceSlug, projectId);
      fetchProjectIntakeState(workspaceSlug, projectId);
      getProjectEstimates(workspaceSlug, projectId);
      fetchAllCycles(workspaceSlug, projectId);
      fetchModules(workspaceSlug, projectId);
      fetchViews(workspaceSlug, projectId);
    });

    return () => cancelIdleCallback(idleCallbackId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProjectDetailsLoading, projectDetailsError, workspaceSlug, projectId, currentUserData?.id]);

  // handle join project
  const handleJoinProject = () => {
    setIsJoiningProject(true);
    joinProject(workspaceSlug, projectId).finally(() => setIsJoiningProject(false));
  };

  // fetching project modules (slim version - lightweight, loads in critical path)
  useSWR(PROJECT_MODULES_SLIM(projectId, currentProjectRole), () => fetchModulesSlim(workspaceSlug, projectId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });

  const isProjectLoading = (isParentLoading || isProjectDetailsLoading) && !projectDetailsError;

  if (isProjectLoading) return <ProjectLoadingSkeleton />;

  if (!isProjectLoading && hasPermissionToCurrentProject === false) {
    return (
      <ProjectAccessRestriction
        errorStatusCode={projectDetailsError?.status}
        isWorkspaceAdmin={isWorkspaceAdmin}
        handleJoinProject={handleJoinProject}
        isJoinButtonDisabled={isJoiningProject}
      />
    );
  }

  return <>{children}</>;
});
