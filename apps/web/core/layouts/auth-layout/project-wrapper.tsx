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
import { GANTT_TIMELINE_TYPE } from "@plane/types";
// components
import { ProjectAccessRestriction } from "@/components/auth-screens/project/project-access-restriction";
import {
  PROJECT_DETAILS,
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
import { useUser } from "@/hooks/store/user";
import { useTimeLineChart } from "@/hooks/use-timeline-chart";
// plane web imports
import { useEpicMeta } from "@/hooks/store/use-epic-meta";
import { useIssueTypes } from "@/plane-web/hooks/store/issue-types/use-issue-types";
import { useMilestones } from "@/plane-web/hooks/store/use-milestone";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { usePermissionAccess } from "@/hooks/store/use-permission-access";

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
  const {
    project: { joinProject },
  } = useMember();
  const { getCurrentUserProjectRoleSlug } = usePermissionAccess();
  const { permissions: workspacePermissions } = useWorkspace();
  const { fetchProjectDetails } = useProject();
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
  const {
    isWorkItemTypeEnabledForProject,
    isEpicEnabledForProject,
    fetchAllWorkItemTypePropertiesAndOptions,
    fetchAllEpicPropertiesAndOptions,
  } = useIssueTypes();
  const { fetchMilestones, isMilestonesEnabled } = useMilestones();
  const { fetchEpicsMeta } = useEpicMeta();
  // derived values
  const currentProjectRoleSlug = getCurrentUserProjectRoleSlug(projectId) ?? undefined;
  const isWorkItemTypeEnabled = projectId ? isWorkItemTypeEnabledForProject(workspaceSlug, projectId) : false;
  const isEpicEnabled = projectId ? isEpicEnabledForProject(workspaceSlug, projectId) : false;
  const isMilestonesFeatureEnabled = projectId ? isMilestonesEnabled(workspaceSlug, projectId) : false;
  // Initialize module timeline chart
  useEffect(() => {
    initGantt();
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fetching project details
  const { isLoading: isProjectDetailsLoading, error: projectDetailsError } = useSWR(
    PROJECT_DETAILS(workspaceSlug, projectId),
    () => fetchProjectDetails(workspaceSlug, projectId)
  );
  // fetching project member preferences
  useSWR(
    currentUserData?.id ? PROJECT_MEMBER_PREFERENCES(projectId, currentProjectRoleSlug) : null,
    currentUserData?.id ? () => fetchProjectUserProperties(workspaceSlug, projectId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project labels
  useSWR(PROJECT_LABELS(projectId, currentProjectRoleSlug), () => fetchProjectLabels(workspaceSlug, projectId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });
  // fetching project members
  useSWR(PROJECT_MEMBERS(projectId, currentProjectRoleSlug), () => fetchProjectMembers(workspaceSlug, projectId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });
  // fetching project states
  useSWR(PROJECT_STATES(projectId, currentProjectRoleSlug), () => fetchProjectStates(workspaceSlug, projectId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });
  // fetching project intake state
  useSWR(
    PROJECT_INTAKE_STATE(projectId, currentProjectRoleSlug),
    () => fetchProjectIntakeState(workspaceSlug, projectId),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );
  // fetching project estimates
  useSWR(PROJECT_ESTIMATES(projectId, currentProjectRoleSlug), () => getProjectEstimates(workspaceSlug, projectId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });
  // fetching project cycles
  useSWR(PROJECT_ALL_CYCLES(projectId, currentProjectRoleSlug), () => fetchAllCycles(workspaceSlug, projectId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });
  // fetching project modules
  useSWR(
    PROJECT_MODULES(projectId, currentProjectRoleSlug),
    async () => {
      await Promise.all([fetchModulesSlim(workspaceSlug, projectId), fetchModules(workspaceSlug, projectId)]);
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching project views
  useSWR(PROJECT_VIEWS(projectId, currentProjectRoleSlug), () => fetchViews(workspaceSlug, projectId), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });

  // fetching all work item types and properties
  useSWR(
    isWorkItemTypeEnabled ? WORK_ITEM_TYPES_PROPERTIES_AND_OPTIONS(projectId, currentProjectRoleSlug) : null,
    isWorkItemTypeEnabled ? () => fetchAllWorkItemTypePropertiesAndOptions(workspaceSlug, projectId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching all epic types and properties
  useSWR(
    isEpicEnabled ? EPICS_PROPERTIES_AND_OPTIONS(projectId, currentProjectRoleSlug) : null,
    isEpicEnabled ? () => fetchAllEpicPropertiesAndOptions(workspaceSlug, projectId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching project level milestones
  useSWR(
    isMilestonesFeatureEnabled ? PROJECT_MILESTONES(projectId, currentProjectRoleSlug) : null,
    isMilestonesFeatureEnabled ? () => fetchMilestones(workspaceSlug, projectId) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // fetching project level epic meta
  useSWR(
    isEpicEnabled ? PROJECT_EPICS_META(projectId, currentProjectRoleSlug) : null,
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

  const wrapperLoader = isProjectDetailsLoading;
  const wrapperError = !!projectDetailsError;

  if (wrapperLoader && !wrapperError) return null;

  if (!wrapperLoader && wrapperError) {
    return (
      <ProjectAccessRestriction
        errorStatusCode={projectDetailsError?.status}
        canJoinAnyProject={workspacePermissions.getCanJoinAnyProject(workspaceSlug)}
        handleJoinProject={handleJoinProject}
        isJoinButtonDisabled={isJoiningProject}
      />
    );
  }

  return <>{children}</>;
});
