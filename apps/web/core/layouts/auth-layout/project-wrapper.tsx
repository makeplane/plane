/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { GANTT_TIMELINE_TYPE } from "@plane/types";
// components
import { ProjectAccessRestriction } from "@/components/auth-screens/project/project-access-restriction";
import {
  PROJECT_DETAILS,
  PROJECT_ME_INFORMATION,
  PROJECT_LABELS,
  PROJECT_MEMBERS,
  PROJECT_MEMBER_PREFERENCES,
  PROJECT_STATES,
  PROJECT_ESTIMATES,
  PROJECT_ALL_CYCLES,
  PROJECT_MODULES,
  PROJECT_VIEWS,
  PROJECT_INTAKE_STATE,
  WORK_ITEM_TYPES_PROPERTIES_AND_OPTIONS,
  EPICS_PROPERTIES_AND_OPTIONS,
  PROJECT_WORKFLOWS,
  PROJECT_MILESTONES,
  PROJECT_EPICS_META,
} from "@/constants/fetch-keys";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useCycle } from "@/hooks/store/use-cycle";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useProjectView } from "@/hooks/store/use-project-view";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { useTimeLineChart } from "@/hooks/use-timeline-chart";
// plane web imports
import { useEpicMeta } from "@/hooks/store/use-epic-meta";
import { useIssueTypes } from "@/plane-web/hooks/store/issue-types/use-issue-types";
import { useMilestones } from "@/plane-web/hooks/store/use-milestone";
import { useFlag } from "@/plane-web/hooks/store/use-flag";

interface IProjectAuthWrapper {
  workspaceSlug: string;
  projectId: string;
  children: ReactNode;
}

export const ProjectAuthWrapper = observer(function ProjectAuthWrapper(props: IProjectAuthWrapper) {
  const { workspaceSlug, projectId, children } = props;
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
  const { fetchProjectStates, fetchProjectIntakeState, fetchWorkflowStates } = useProjectState();
  const { data: currentUserData } = useUser();
  const { fetchProjectLabels } = useLabel();
  const { getProjectEstimates } = useProjectEstimates();
  const {
    isWorkItemTypeEnabledForProject,
    isEpicEnabledForProject,
    fetchAllWorkItemTypePropertiesAndOptions,
    fetchAllEpicPropertiesAndOptions,
  } = useIssueTypes();
  const { fetchMilestones, isMilestonesEnabled } = useMilestones();
  const { fetchEpicsMeta } = useEpicMeta();
  // derived values
  const hasPermissionToCurrentProject = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );
  const currentProjectRole = getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId);
  const isWorkspaceAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE, workspaceSlug);
  const isWorkItemTypeEnabled = projectId ? isWorkItemTypeEnabledForProject(workspaceSlug, projectId) : false;
  const isEpicEnabled = projectId ? isEpicEnabledForProject(workspaceSlug, projectId) : false;
  const isWorkflowFeatureFlagEnabled = useFlag(workspaceSlug, "WORKFLOWS");
  const isMilestonesFeatureEnabled = projectId ? isMilestonesEnabled(workspaceSlug, projectId) : false;
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
  // fetching project member preferences
  useSWR(
    currentUserData?.id ? PROJECT_MEMBER_PREFERENCES(projectId, currentProjectRole) : null,
    currentUserData?.id ? () => fetchProjectUserProperties(workspaceSlug, projectId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project labels
  useSWR(PROJECT_LABELS(projectId, currentProjectRole), () => fetchProjectLabels(workspaceSlug, projectId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });
  // fetching project members
  useSWR(PROJECT_MEMBERS(projectId, currentProjectRole), () => fetchProjectMembers(workspaceSlug, projectId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });
  // fetching project states
  useSWR(PROJECT_STATES(projectId, currentProjectRole), () => fetchProjectStates(workspaceSlug, projectId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });
  // fetching project intake state
  useSWR(PROJECT_INTAKE_STATE(projectId, currentProjectRole), () => fetchProjectIntakeState(workspaceSlug, projectId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });
  // fetching project estimates
  useSWR(PROJECT_ESTIMATES(projectId, currentProjectRole), () => getProjectEstimates(workspaceSlug, projectId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });
  // fetching project cycles
  useSWR(PROJECT_ALL_CYCLES(projectId, currentProjectRole), () => fetchAllCycles(workspaceSlug, projectId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });
  // fetching project modules
  useSWR(
    PROJECT_MODULES(projectId, currentProjectRole),
    async () => {
      await Promise.all([fetchModulesSlim(workspaceSlug, projectId), fetchModules(workspaceSlug, projectId)]);
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project views
  useSWR(PROJECT_VIEWS(projectId, currentProjectRole), () => fetchViews(workspaceSlug, projectId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });

  // fetching all work item types and properties
  useSWR(
    isWorkItemTypeEnabled ? WORK_ITEM_TYPES_PROPERTIES_AND_OPTIONS(projectId, currentProjectRole) : null,
    isWorkItemTypeEnabled ? () => fetchAllWorkItemTypePropertiesAndOptions(workspaceSlug, projectId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching all epic types and properties
  useSWR(
    isEpicEnabled ? EPICS_PROPERTIES_AND_OPTIONS(projectId, currentProjectRole) : null,
    isEpicEnabled ? () => fetchAllEpicPropertiesAndOptions(workspaceSlug, projectId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching project level workflow states
  useSWR(
    isWorkflowFeatureFlagEnabled ? PROJECT_WORKFLOWS(projectId, currentProjectRole) : null,
    () => fetchWorkflowStates(workspaceSlug, projectId),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  // fetching project level milestones
  useSWR(
    isMilestonesFeatureEnabled ? PROJECT_MILESTONES(projectId, currentProjectRole) : null,
    isMilestonesFeatureEnabled ? () => fetchMilestones(workspaceSlug, projectId) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // fetching project level epic meta
  useSWR(
    isEpicEnabled ? PROJECT_EPICS_META(projectId, currentProjectRole) : null,
    isEpicEnabled ? () => fetchEpicsMeta(workspaceSlug, projectId) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // handle join project
  const handleJoinProject = () => {
    setIsJoiningProject(true);
    joinProject(workspaceSlug, projectId)
      .finally(() => setIsJoiningProject(false))
      .catch((error) => {
        console.error("Error joining project", error);
        setIsJoiningProject(false);
      });
  };

  const isProjectLoading = isProjectDetailsLoading && !projectDetailsError;

  if (isProjectLoading) return null;

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
