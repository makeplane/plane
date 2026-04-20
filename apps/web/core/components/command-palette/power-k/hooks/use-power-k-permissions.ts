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

// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useProject } from "@/hooks/store/use-project";
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store/use-page-store";
import { useProjectView } from "@/hooks/store/use-project-view";
import { useCycle } from "@/hooks/store/use-cycle";
import { useModule } from "@/hooks/store/use-module";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { useDashboards } from "@/plane-web/hooks/store/dashboards";
import { useCustomers } from "@/plane-web/hooks/store/customers/use-customers";
import { useTeamspaces } from "@/plane-web/hooks/store/teamspaces/use-teamspaces";
import { useIssues } from "@/hooks/store/use-issues";
// types
import type { TPowerKCreationCommandKeys } from "@/components/power-k/config/creation/root";
import type { TPowerKNavigationCommandKeys } from "@/components/power-k/config/navigation/root";
import type { TPowerKActionsCommandKeys } from "@/components/power-k/config/actions-commands";
import { useWorkspaceAccess } from "@/hooks/permissions/use-workspace-access";
import { useProjectAccess } from "@/hooks/permissions/use-project-access";

export const usePowerKPermissions = () => {
  // store hooks
  const { permissions: workspacePermissions } = useWorkspace();
  const { permissions: projectPermissions, workspaceProjectIds } = useProject();
  const { getCanCreatePage } = usePageStore(EPageStoreType.PROJECT);
  const { permissions: cyclePermissions } = useCycle();
  const { permissions: modulePermissions } = useModule();
  const { permissions: projectViewPermissions } = useProjectView();
  const { permissions: workItemPermissions } = useIssues();
  const {
    initiative: { permissions: initiativePermissions },
  } = useInitiatives();
  const {
    workspaceDashboards: { getCanCreateDashboard },
  } = useDashboards();
  const { permissions: customerPermissions } = useCustomers();
  const { permissions: teamspacePermissions } = useTeamspaces();
  const { canAccessWorkspaceResource, isWorkspaceFeatureEnabled } = useWorkspaceAccess();
  const { canAccessProjectResource, isProjectFeatureEnabled } = useProjectAccess();

  const canCreateResource = (
    workspaceSlug: string | undefined,
    projectId: string | undefined,
    creationCommandKey: TPowerKCreationCommandKeys
  ): boolean => {
    const permissionChecks: Record<TPowerKCreationCommandKeys, () => boolean> = {
      create_work_item: () => {
        const projectIdsWithCreateWorkItemPermission = workspaceSlug
          ? workItemPermissions.getProjectIdsWithWorkItemPermission(workspaceSlug, workspaceProjectIds || [], "create")
          : new Set<string>();
        const canCreateWorkItem = projectIdsWithCreateWorkItemPermission.size > 0;
        return Boolean(canCreateWorkItem);
      },
      create_page: () => {
        const canCreatePage =
          workspaceSlug &&
          projectId &&
          isProjectFeatureEnabled(workspaceSlug, projectId, "pages") &&
          getCanCreatePage(workspaceSlug, projectId);
        return Boolean(canCreatePage);
      },
      create_view: () => {
        const canCreateView =
          workspaceSlug &&
          projectId &&
          isProjectFeatureEnabled(workspaceSlug, projectId, "views") &&
          projectViewPermissions.getCanCreateView(workspaceSlug, projectId);
        return Boolean(canCreateView);
      },
      create_cycle: () => {
        const canCreateCycle =
          workspaceSlug &&
          projectId &&
          isProjectFeatureEnabled(workspaceSlug, projectId, "cycles") &&
          cyclePermissions.getCanCreateCycle(workspaceSlug, projectId);
        return Boolean(canCreateCycle);
      },
      create_module: () => {
        const canCreateModule =
          workspaceSlug &&
          projectId &&
          isProjectFeatureEnabled(workspaceSlug, projectId, "modules") &&
          modulePermissions.getCanCreateModule(workspaceSlug, projectId);
        return Boolean(canCreateModule);
      },
      create_project: () => {
        const canCreateProject = workspaceSlug && projectPermissions.getCanCreate(workspaceSlug);
        return Boolean(canCreateProject);
      },
      create_workspace: () => {
        const canCreateWorkspace = workspacePermissions.getCanCreate();
        return Boolean(canCreateWorkspace);
      },
      create_teamspace: () => {
        const canCreateTeamspace =
          workspaceSlug &&
          isWorkspaceFeatureEnabled(workspaceSlug, "team_spaces") &&
          teamspacePermissions.getCanCreate(workspaceSlug);
        return Boolean(canCreateTeamspace);
      },
      create_initiative: () => {
        const canCreateInitiative =
          workspaceSlug &&
          isWorkspaceFeatureEnabled(workspaceSlug, "initiatives") &&
          initiativePermissions.getCanCreate(workspaceSlug);
        return Boolean(canCreateInitiative);
      },
      create_workspace_dashboard: () => {
        const canCreateWorkspaceDashboard =
          workspaceSlug &&
          isWorkspaceFeatureEnabled(workspaceSlug, "dashboards") &&
          getCanCreateDashboard(workspaceSlug);
        return Boolean(canCreateWorkspaceDashboard);
      },
      create_customer: () => {
        const canCreateCustomer =
          workspaceSlug &&
          isWorkspaceFeatureEnabled(workspaceSlug, "customers") &&
          customerPermissions.getCanCreate(workspaceSlug);
        return Boolean(canCreateCustomer);
      },
    };

    return permissionChecks[creationCommandKey]();
  };

  const canNavigateTo = (
    workspaceSlug: string | undefined,
    projectId: string | undefined,
    navigationCommandKey: TPowerKNavigationCommandKeys
  ) => {
    const permissionChecks: Record<TPowerKNavigationCommandKeys, () => boolean> = {
      open_workspace: () => {
        return Boolean(workspaceSlug);
      },
      nav_home: () => {
        return Boolean(workspaceSlug && canAccessWorkspaceResource(workspaceSlug, "home"));
      },
      nav_inbox: () => {
        return Boolean(workspaceSlug && canAccessWorkspaceResource(workspaceSlug, "inbox"));
      },
      nav_your_work: () => {
        return Boolean(workspaceSlug && canAccessWorkspaceResource(workspaceSlug, "your_work"));
      },
      nav_account_settings: () => {
        return Boolean(workspaceSlug);
      },
      open_project: () => {
        return Boolean(workspaceSlug && canAccessWorkspaceResource(workspaceSlug, "projects"));
      },
      nav_projects_list: () => {
        return Boolean(workspaceSlug && canAccessWorkspaceResource(workspaceSlug, "projects"));
      },
      nav_all_workspace_work_items: () => {
        return Boolean(workspaceSlug && canAccessWorkspaceResource(workspaceSlug, "views"));
      },
      nav_assigned_workspace_work_items: () => {
        return Boolean(workspaceSlug && canAccessWorkspaceResource(workspaceSlug, "views"));
      },
      nav_created_workspace_work_items: () => {
        return Boolean(workspaceSlug && canAccessWorkspaceResource(workspaceSlug, "views"));
      },
      nav_subscribed_workspace_work_items: () => {
        return Boolean(workspaceSlug && canAccessWorkspaceResource(workspaceSlug, "views"));
      },
      nav_workspace_analytics: () => {
        return Boolean(workspaceSlug && canAccessWorkspaceResource(workspaceSlug, "analytics"));
      },
      nav_workspace_drafts: () => {
        return Boolean(workspaceSlug && canAccessWorkspaceResource(workspaceSlug, "drafts"));
      },
      nav_workspace_archives: () => {
        return Boolean(workspaceSlug && canAccessWorkspaceResource(workspaceSlug, "archives")) && !projectId;
      },
      open_workspace_setting: () => {
        return Boolean(workspaceSlug) && !projectId;
      },
      nav_workspace_settings: () => {
        return Boolean(workspaceSlug) && !projectId;
      },
      nav_project_work_items: () => {
        return Boolean(workspaceSlug && projectId && canAccessProjectResource(workspaceSlug, projectId, "work_items"));
      },
      open_project_cycle: () => {
        return Boolean(workspaceSlug && projectId && canAccessProjectResource(workspaceSlug, projectId, "cycles"));
      },
      nav_project_cycles: () => {
        return Boolean(workspaceSlug && projectId && canAccessProjectResource(workspaceSlug, projectId, "cycles"));
      },
      open_project_module: () => {
        return Boolean(workspaceSlug && projectId && canAccessProjectResource(workspaceSlug, projectId, "modules"));
      },
      nav_project_modules: () => {
        return Boolean(workspaceSlug && projectId && canAccessProjectResource(workspaceSlug, projectId, "modules"));
      },
      open_project_view: () => {
        return Boolean(workspaceSlug && projectId && canAccessProjectResource(workspaceSlug, projectId, "views"));
      },
      nav_project_views: () => {
        return Boolean(workspaceSlug && projectId && canAccessProjectResource(workspaceSlug, projectId, "views"));
      },
      nav_project_pages: () => {
        return Boolean(workspaceSlug && projectId && canAccessProjectResource(workspaceSlug, projectId, "pages"));
      },
      nav_project_intake: () => {
        return Boolean(workspaceSlug && projectId && canAccessProjectResource(workspaceSlug, projectId, "intake"));
      },
      nav_project_archives: () => {
        return Boolean(workspaceSlug && projectId && canAccessProjectResource(workspaceSlug, projectId, "archives"));
      },
      open_project_setting: () => {
        return Boolean(workspaceSlug && projectId && projectPermissions.getCanManage(workspaceSlug, projectId));
      },
      nav_project_settings: () => {
        return Boolean(workspaceSlug && projectId && projectPermissions.getCanManage(workspaceSlug, projectId));
      },
      nav_workspace_active_cycle: () => {
        const canVisitActiveCycles = workspaceSlug && canAccessWorkspaceResource(workspaceSlug, "active-cycles");
        return Boolean(canVisitActiveCycles);
      },
      open_teamspace: () => {
        const canVisitTeamspaces = workspaceSlug && canAccessWorkspaceResource(workspaceSlug, "team_spaces");
        return Boolean(canVisitTeamspaces);
      },
      nav_teamspaces_list: () => {
        const canVisitTeamspaces = workspaceSlug && canAccessWorkspaceResource(workspaceSlug, "team_spaces");
        return Boolean(canVisitTeamspaces);
      },
      open_initiative: () => {
        const canVisitInitiatives = workspaceSlug && canAccessWorkspaceResource(workspaceSlug, "initiatives");
        return Boolean(canVisitInitiatives);
      },
      nav_initiatives_list: () => {
        const canVisitInitiatives = workspaceSlug && canAccessWorkspaceResource(workspaceSlug, "initiatives");
        return Boolean(canVisitInitiatives);
      },
      open_customer: () => {
        const canVisitCustomers = workspaceSlug && canAccessWorkspaceResource(workspaceSlug, "customers");
        return Boolean(canVisitCustomers);
      },
      nav_customers_list: () => {
        const canVisitCustomers = workspaceSlug && canAccessWorkspaceResource(workspaceSlug, "customers");
        return Boolean(canVisitCustomers);
      },
      nav_workspace_dashboards: () => {
        const canVisitWorkspaceDashboards = workspaceSlug && canAccessWorkspaceResource(workspaceSlug, "dashboards");
        return Boolean(canVisitWorkspaceDashboards);
      },
      nav_project_overview: () => {
        const canVisitProjectOverview =
          workspaceSlug && projectId && canAccessProjectResource(workspaceSlug, projectId, "overview");
        return Boolean(canVisitProjectOverview);
      },
      nav_project_epics: () => {
        const canVisitProjectEpics =
          workspaceSlug && projectId && canAccessProjectResource(workspaceSlug, projectId, "epics");
        return Boolean(canVisitProjectEpics);
      },
    };
    return permissionChecks[navigationCommandKey]();
  };

  const canPerformAction = (
    workspaceSlug: string | undefined,
    projectId: string | undefined,
    actionCommandKey: TPowerKActionsCommandKeys
  ) => {
    const permissionChecks: Record<TPowerKActionsCommandKeys, () => boolean> = {
      bulk_delete_work_items: () => {
        const canPerformBulkDelete =
          workspaceSlug && projectId && workItemPermissions.getCanPerformBulkOps(workspaceSlug, projectId); // TODO: <PermissionEngine> Need to verify backend as it checks for workitem:delete, which requires a resourceId on frontend.
        return Boolean(canPerformBulkDelete);
      },
    };
    return permissionChecks[actionCommandKey]();
  };

  return {
    canCreateResource,
    canNavigateTo,
    canPerformAction,
  };
};
