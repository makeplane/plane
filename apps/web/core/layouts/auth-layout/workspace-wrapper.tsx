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
import { observer } from "mobx-react";
import { useLocation } from "react-router";
import useSWR from "swr";
// plane imports
import { ETemplateLevel } from "@plane/constants";
// components
import { WorkspaceAccessRestriction } from "@/components/auth-screens/workspace/workspace-access-restriction";
import { WorkspaceDowngradePage } from "@/components/auth-screens/workspace/downgrade";
// constants
import {
  WORKSPACE_MEMBERS,
  WORKSPACE_PARTIAL_PROJECTS,
  WORKSPACE_TEAMSPACES,
  WORKSPACE_FEATURES,
  WORKSPACE_PROJECT_FEATURES,
  WORKSPACE_PREFERENCES,
  WORKSPACE_CURRENT_USER_PERMISSIONS,
  WORKSPACE_ROLES,
  WORKSPACE_PERMISSION_SCHEMES,
  WORKSPACE_FAVORITE,
  WORKSPACE_STATES,
  WORKSPACE_SIDEBAR_PREFERENCES,
  WORKSPACE_PROJECT_NAVIGATION_PREFERENCES,
  WORKSPACE_FLAGS,
  AI_FLAGS,
  WORKSPACE_RELEASES,
  RUNNER_HEALTH,
  PI_STARTER,
} from "@/constants/fetch-keys";
// hooks
import { useFavorite } from "@/hooks/store/use-favorite";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useWorkspacePreferences } from "@/hooks/store/use-workspace-preferences";
// plane web imports
import { useFeatureFlags } from "@/plane-web/hooks/store/use-feature-flags";
import { useWorkspaceFeatures } from "@/plane-web/hooks/store/use-workspace-features";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";
import { useWorkspaceProjectStates } from "@/plane-web/hooks/store/workspace-project-states/use-workspace-project-states";
import { useWorkspaceProjectLabels } from "@/hooks/store/use-workspace-project-labels";
import { useTeamspaces } from "@/plane-web/hooks/store/teamspaces/use-teamspaces";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store/use-workspace-subscription";
import { useIssueTypes } from "@/plane-web/hooks/store/issue-types/use-issue-types";
import { useProjectTemplates } from "@/plane-web/hooks/store/templates/use-project-templates";
import { useWorkItemTemplates } from "@/plane-web/hooks/store/templates/use-work-item-templates";
import { usePageTemplates } from "@/plane-web/hooks/store/templates/use-page-templates";
import { useTemplateHelper } from "@/plane-web/hooks/store/templates/use-template-helper";
import { useCustomerProperties } from "@/plane-web/hooks/store/customers/use-customer-properties";
import { useCustomers } from "@/plane-web/hooks/store/customers/use-customers";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { useFlag } from "@/plane-web/hooks/store/use-flag";
import { useWorkflows } from "@/hooks/store/use-workflows";
import { useRelationDefinition } from "@/hooks/store/use-relation-definition";
import { useRunners } from "@/plane-web/hooks/store";
// types
import { EWorkspaceFeatures } from "@/types/workspace-feature";
import { usePermissionAccess } from "@/hooks/store/use-permission-access";
import { useRoleManagement } from "@/hooks/store/use-role-management";
import { usePermissionScheme } from "@/hooks/store/use-permission-scheme";
import { useAiFeatureFlags } from "@/plane-web/hooks/store/use-ai-feature-flags";
import { useConnectors } from "@/plane-web/hooks/store/marketplace/use-connectors";
import { useWorkspaceWorkItemTypes } from "@/plane-web/hooks/store/work-item-types/use-workspace-work-item-types";
import { useWorkspaceCustomProperties } from "@/plane-web/hooks/store/custom-properties/use-workspace-custom-properties";
import { useReleases } from "@/hooks/store/use-releases";
import { useAiFlag } from "@/plane-web/hooks/store/use-ai-flag";

type WorkspaceAuthWrapper = {
  children: ReactNode;
  workspaceSlug: string;
};

export const WorkspaceAuthWrapper = observer(function WorkspaceAuthWrapper(props: WorkspaceAuthWrapper) {
  const { children, workspaceSlug } = props;
  // router params
  const { pathname } = useLocation();
  // store hooks
  const { fetchPartialProjects } = useProject();
  const { fetchFavorite, permissions: favoritePermissions } = useFavorite();
  const {
    workspace: { fetchWorkspaceMembers },
  } = useMember();
  const { workspaces, fetchSidebarNavigationPreferences, fetchProjectNavigationPreferences } = useWorkspace();
  const { fetchPreferences } = useWorkspacePreferences();
  const { fetchWorkspaceStates } = useProjectState();
  const { fetchFeatureFlags, fetchIntegrations } = useFeatureFlags();
  const { fetchAiFeatureFlags } = useAiFeatureFlags();
  const { fetchWorkspaceFeatures, isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const { fetchProjectFeatures } = useProjectAdvanced();
  const { fetchProjectStates } = useWorkspaceProjectStates();
  const { fetchWorkspaceProjectLabels } = useWorkspaceProjectLabels();
  const { isTeamspacesFeatureEnabled, fetchTeamspaces } = useTeamspaces();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, fetchWorkspaceSubscribedPlan } =
    useWorkspaceSubscription();
  const { fetchAll: fetchAllIssueTypes } = useIssueTypes();
  const { fetchTypes: fetchAllWorkspaceWorkItemTypes } = useWorkspaceWorkItemTypes();
  const { fetchPropertiesAndOptions: fetchAllWorkspaceCustomPropertiesAndOptions } = useWorkspaceCustomProperties();
  const { fetchAllTemplates: fetchAllProjectTemplates } = useProjectTemplates();
  const { fetchAllTemplates: fetchAllWorkItemTemplates } = useWorkItemTemplates();
  const { fetchAllTemplates: fetchAllPageTemplates } = usePageTemplates();
  const { getIsTemplatePublishEnabled, fetchTemplateCategories } = useTemplateHelper();
  const { fetchAllCustomerPropertiesAndOptions } = useCustomerProperties();
  const { isCustomersFeatureEnabled, fetchCustomers } = useCustomers();
  const { initiative } = useInitiatives();
  const { getWorkspaceBySlug } = useWorkspace();
  const { getInstance } = usePiChat();
  const { fetchAllWorkflows } = useWorkflows();
  const { fetchConnectors } = useConnectors();
  const { fetchRelationDefinitions } = useRelationDefinition();
  const { fetchScripts, checkRunnerHealth } = useRunners();
  const { fetchCurrentUserWorkspacePermissions } = usePermissionAccess();
  const { fetchAllWorkspaceRoles } = useRoleManagement();
  const { fetchAllWorkspaceSchemes } = usePermissionScheme();
  const {
    release: { fetchReleases, isReleasesEnabled },
  } = useReleases();
  // derived values
  const canViewFavorites = favoritePermissions.getCanView(workspaceSlug);
  const allWorkspaces = workspaces ? Object.values(workspaces) : undefined;
  const currentWorkspace =
    (allWorkspaces && allWorkspaces.find((workspace) => workspace?.slug === workspaceSlug)) || undefined;
  const isFreeMemberCountExceeded = subscriptionDetail?.is_free_member_count_exceeded;
  const isWorkspaceSettingsRoute = pathname.includes(`/${workspaceSlug}/settings`);
  const isIssueTypesEnabled = useFlag(workspaceSlug, "ISSUE_TYPES", false);
  const isWorkspaceWorkItemTypesEnabled = useFlag(workspaceSlug, "WORKSPACE_WORK_ITEM_TYPES", false);
  const isEpicsEnabled = useFlag(workspaceSlug, "EPICS", false);
  const isProjectStateEnabled = isWorkspaceFeatureEnabled(
    workspaceSlug,
    EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED
  );
  const isProjectTemplatesEnabled = useFlag(workspaceSlug, "PROJECT_TEMPLATES");
  const isWorkItemTemplatesEnabled = useFlag(workspaceSlug, "WORKITEM_TEMPLATES");
  const isPageTemplatesEnabled = useFlag(workspaceSlug, "PAGE_TEMPLATES");
  const isInitiativesFeatureEnabled = initiative.isInitiativesFeatureEnabled;
  const isTemplatePublishEnabled = getIsTemplatePublishEnabled(workspaceSlug);
  const isWorkflowsFeatureEnabled = useFlag(workspaceSlug, "WORKFLOWS");
  const isCustomRelationsEnabled = useFlag(workspaceSlug, "CUSTOM_RELATIONS", false);
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id;
  const isMcpConnectorEnabled = useAiFlag(workspaceSlug, "AI_MCP_CONNECTORS", false);

  // fetching user workspace information
  useSWR(
    currentWorkspace ? WORKSPACE_PREFERENCES(workspaceSlug) : null,
    currentWorkspace ? () => fetchPreferences(workspaceSlug) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching workspace projects
  useSWR(
    currentWorkspace ? WORKSPACE_PARTIAL_PROJECTS(workspaceSlug) : null,
    currentWorkspace ? () => fetchPartialProjects(workspaceSlug) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetch workspace members
  useSWR(
    currentWorkspace ? WORKSPACE_MEMBERS(workspaceSlug) : null,
    currentWorkspace ? () => fetchWorkspaceMembers(workspaceSlug) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetch workspace favorite
  useSWR(
    currentWorkspace && canViewFavorites ? WORKSPACE_FAVORITE(workspaceSlug) : null,
    currentWorkspace && canViewFavorites ? () => fetchFavorite(workspaceSlug) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetch workspace states
  useSWR(WORKSPACE_STATES(workspaceSlug), () => fetchWorkspaceStates(workspaceSlug), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });
  // fetch relation definitions
  useSWR(
    currentWorkspace ? `RELATION_DEFINITIONS_${workspaceSlug}_${isCustomRelationsEnabled}` : null,
    currentWorkspace
      ? () => fetchRelationDefinitions(workspaceSlug, { is_default: isCustomRelationsEnabled ? "false" : "true" })
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetch workspace sidebar preferences
  useSWR(WORKSPACE_SIDEBAR_PREFERENCES(workspaceSlug), () => fetchSidebarNavigationPreferences(workspaceSlug), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });

  // fetch workspace project navigation preferences
  useSWR(
    WORKSPACE_PROJECT_NAVIGATION_PREFERENCES(workspaceSlug),
    () => fetchProjectNavigationPreferences(workspaceSlug),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  // fetching feature flags
  useSWR(WORKSPACE_FLAGS(workspaceSlug), () => fetchFeatureFlags(workspaceSlug), {
    revalidateOnFocus: false,
    errorRetryCount: 1,
  });

  useSWR(AI_FLAGS(workspaceSlug), () => fetchAiFeatureFlags(workspaceSlug), {
    revalidateOnFocus: false,
    errorRetryCount: 1,
  });

  // fetching integrations
  useSWR(`WORKSPACE_INTEGRATIONS_${workspaceSlug}`, () => fetchIntegrations(workspaceSlug), {
    revalidateOnFocus: false,
    errorRetryCount: 1,
  });
  // fetch workspace current plane information
  useSWR(`WORKSPACE_CURRENT_PLAN_${workspaceSlug}`, () => fetchWorkspaceSubscribedPlan(workspaceSlug), {
    errorRetryCount: 2,
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });
  // fetching workspace features
  useSWR(
    currentWorkspace ? WORKSPACE_FEATURES(workspaceSlug) : null,
    currentWorkspace ? () => fetchWorkspaceFeatures(workspaceSlug) : null,
    { revalidateOnFocus: false }
  );

  // fetching project features
  useSWR(
    currentWorkspace ? WORKSPACE_PROJECT_FEATURES(workspaceSlug) : null,
    currentWorkspace ? () => fetchProjectFeatures(workspaceSlug) : null,
    { revalidateOnFocus: false }
  );

  // fetch project states
  useSWR(
    currentWorkspace && isProjectStateEnabled ? `WORKSPACE_PROJECT_STATES_${workspaceSlug}` : null,
    () => (currentWorkspace && isProjectStateEnabled ? fetchProjectStates(workspaceSlug) : null),
    { revalidateOnFocus: false }
  );
  // fetch workspace project labels
  useSWR(
    currentWorkspace && isProjectStateEnabled ? `WORKSPACE_PROJECT_LABELS_${workspaceSlug}` : null,
    () => (currentWorkspace && isProjectStateEnabled ? fetchWorkspaceProjectLabels(workspaceSlug) : null),
    { revalidateOnFocus: false }
  );
  // fetching all issue types and epics for the workspace
  useSWR(
    isIssueTypesEnabled || isEpicsEnabled
      ? `WORKSPACE_ISSUE_TYPES_${workspaceSlug}_${isIssueTypesEnabled}_${isEpicsEnabled}`
      : null,
    isIssueTypesEnabled || isEpicsEnabled ? () => fetchAllIssueTypes(workspaceSlug) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching all workspace work item types
  useSWR(
    isWorkspaceWorkItemTypesEnabled
      ? `WORKSPACE_WORK_ITEM_TYPES_${workspaceSlug}_${isWorkspaceWorkItemTypesEnabled}`
      : null,
    isWorkspaceWorkItemTypesEnabled ? () => fetchAllWorkspaceWorkItemTypes(workspaceSlug) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching all workspace custom properties and options
  useSWR(
    isWorkspaceWorkItemTypesEnabled ? `WORKSPACE_CUSTOM_PROPERTIES_AND_OPTIONS_${workspaceSlug}` : null,
    isWorkspaceWorkItemTypesEnabled ? () => fetchAllWorkspaceCustomPropertiesAndOptions(workspaceSlug) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching workflows
  useSWR(
    isWorkflowsFeatureEnabled ? ["workflows", workspaceSlug, isWorkflowsFeatureEnabled] : null,
    isWorkflowsFeatureEnabled ? () => fetchAllWorkflows(workspaceSlug) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching teamspaces
  useSWR(
    isTeamspacesFeatureEnabled ? WORKSPACE_TEAMSPACES(workspaceSlug) : null,
    isTeamspacesFeatureEnabled ? () => fetchTeamspaces(workspaceSlug) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching customer properties
  useSWR(
    isCustomersFeatureEnabled ? `CUSTOMER_PROPERTIES_${workspaceSlug}_${isCustomersFeatureEnabled}` : null,
    isCustomersFeatureEnabled ? () => fetchAllCustomerPropertiesAndOptions(workspaceSlug) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetch customers
  useSWR(
    isCustomersFeatureEnabled ? `CUSTOMERS_${workspaceSlug}_${isCustomersFeatureEnabled}` : null,
    isCustomersFeatureEnabled ? () => fetchCustomers(workspaceSlug) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching all project templates
  useSWR(
    isProjectTemplatesEnabled ? ["projectTemplates", workspaceSlug, isProjectTemplatesEnabled] : null,
    isProjectTemplatesEnabled ? () => fetchAllProjectTemplates({ workspaceSlug: workspaceSlug }) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching all work item templates
  useSWR(
    isWorkItemTemplatesEnabled ? ["workItemTemplates", workspaceSlug, isWorkItemTemplatesEnabled] : null,
    isWorkItemTemplatesEnabled
      ? () =>
          fetchAllWorkItemTemplates({
            workspaceSlug: workspaceSlug,
            level: ETemplateLevel.WORKSPACE,
          })
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching all page templates
  useSWR(
    isPageTemplatesEnabled ? ["pageTemplates", workspaceSlug, isPageTemplatesEnabled] : null,
    isPageTemplatesEnabled
      ? () =>
          fetchAllPageTemplates({
            workspaceSlug: workspaceSlug,
            level: ETemplateLevel.WORKSPACE,
          })
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching all initiatives
  useSWR(
    isInitiativesFeatureEnabled ? ["initiatives", workspaceSlug, isInitiativesFeatureEnabled] : null,
    isInitiativesFeatureEnabled ? () => initiative.fetchInitiatives(workspaceSlug) : null,
    { revalidateOnFocus: false }
  );

  // fetching all initiative labels
  useSWR(
    isInitiativesFeatureEnabled ? ["initiativeLabels", workspaceSlug, isInitiativesFeatureEnabled] : null,
    isInitiativesFeatureEnabled ? () => initiative.fetchInitiativeLabels(workspaceSlug) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching template categories
  useSWR(
    isTemplatePublishEnabled ? ["templateCategories", workspaceSlug, isTemplatePublishEnabled] : null,
    isTemplatePublishEnabled ? () => fetchTemplateCategories() : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching pi auth instance
  useSWR(workspaceSlug ? PI_STARTER(workspaceSlug) : null, workspaceSlug ? () => getInstance(workspaceSlug) : null, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    errorRetryCount: 0,
  });

  // fetching runner health
  useSWR(
    workspaceSlug ? RUNNER_HEALTH(workspaceSlug) : null,
    workspaceSlug ? () => checkRunnerHealth(workspaceSlug) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching runners scripts
  useSWR(
    workspaceSlug ? `RUNNERS_SCRIPTS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchScripts(workspaceSlug ?? "") : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetching releases
  useSWR(
    workspaceSlug && isReleasesEnabled(workspaceSlug) ? WORKSPACE_RELEASES(workspaceSlug) : null,
    workspaceSlug && isReleasesEnabled(workspaceSlug) ? () => fetchReleases(workspaceSlug) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  // fetching connectors list
  useSWR(
    workspaceSlug && isMcpConnectorEnabled ? `CONNECTORS_LIST_${workspaceSlug}` : null,
    workspaceSlug && isMcpConnectorEnabled ? () => fetchConnectors(workspaceSlug) : null,
    {
      revalidateOnFocus: false,
      errorRetryCount: 0,
    }
  );

  // TODO: This can be moved to setting if we are not really using it at this level.
  useSWR(
    workspaceSlug ? WORKSPACE_ROLES(workspaceSlug) : null,
    workspaceSlug ? () => fetchAllWorkspaceRoles(workspaceSlug) : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      errorRetryCount: 0,
    }
  );

  useSWR(
    workspaceSlug ? WORKSPACE_PERMISSION_SCHEMES(workspaceSlug) : null,
    workspaceSlug ? () => fetchAllWorkspaceSchemes(workspaceSlug) : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      errorRetryCount: 0,
    }
  );

  const { isLoading: isWorkspacePermissionsLoading, error: workspacePermissionsError } = useSWR(
    workspaceSlug ? WORKSPACE_CURRENT_USER_PERMISSIONS(workspaceSlug) : null,
    workspaceSlug ? () => fetchCurrentUserWorkspacePermissions(workspaceSlug) : null,
    {
      revalidateIfStale: false,
      errorRetryCount: 0,
    }
  );

  const wrapperLoader = isWorkspacePermissionsLoading;
  const wrapperError = !!workspacePermissionsError;

  if (wrapperLoader && !wrapperError) return null;

  if (!wrapperLoader && wrapperError) {
    return (
      <WorkspaceAccessRestriction errorStatusCode={workspacePermissionsError?.status} allWorkspaces={allWorkspaces} />
    );
  }

  // if workspace has exceeded the free member count
  if (isFreeMemberCountExceeded && !isWorkspaceSettingsRoute) {
    return <WorkspaceDowngradePage />;
  }

  return <>{children}</>;
});
