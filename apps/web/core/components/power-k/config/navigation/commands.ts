import { BarChart2, Briefcase, FileText, Home, Inbox, Layers, PenSquare, Settings } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { ArchiveIcon, UserActivityIcon, LayersIcon, ContrastIcon, DiceIcon, Intake } from "@plane/propel/icons";
import type { ICycle, IModule, IPartialProject, IProjectView, IWorkspace } from "@plane/types";
import { EUserProjectRoles, EUserWorkspaceRoles } from "@plane/types";
// components
import type { TPowerKCommandConfig, TPowerKContext } from "@/components/power-k/core/types";
import { handlePowerKNavigate } from "@/components/power-k/utils/navigation";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";

export type TPowerKNavigationCommandKeys =
  | "open_workspace"
  | "nav_home"
  | "nav_inbox"
  | "nav_your_work"
  | "nav_account_settings"
  | "open_project"
  | "nav_projects_list"
  | "nav_all_workspace_work_items"
  | "nav_assigned_workspace_work_items"
  | "nav_created_workspace_work_items"
  | "nav_subscribed_workspace_work_items"
  | "nav_workspace_analytics"
  | "nav_workspace_drafts"
  | "nav_workspace_archives"
  | "open_workspace_setting"
  | "nav_workspace_settings"
  | "nav_project_work_items"
  | "open_project_cycle"
  | "nav_project_cycles"
  | "open_project_module"
  | "nav_project_modules"
  | "open_project_view"
  | "nav_project_views"
  | "nav_project_pages"
  | "nav_project_intake"
  | "nav_project_archives"
  | "open_project_setting"
  | "nav_project_settings";

/**
 * Navigation commands - Navigate to all pages in the app
 */
export const usePowerKNavigationCommandsRecord = (): Record<TPowerKNavigationCommandKeys, TPowerKCommandConfig> => {
  // store hooks
  const {
    data: currentUser,
    permission: { allowPermissions },
  } = useUser();
  const { getPartialProjectById } = useProject();
  // derived values
  const hasWorkspaceMemberLevelPermissions = (ctx: TPowerKContext) =>
    allowPermissions(
      [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
      EUserPermissionsLevel.WORKSPACE,
      ctx.params.workspaceSlug?.toString()
    );
  const hasProjectMemberLevelPermissions = (ctx: TPowerKContext) =>
    allowPermissions(
      [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
      EUserPermissionsLevel.PROJECT,
      ctx.params.workspaceSlug?.toString(),
      ctx.params.projectId?.toString()
    );
  const baseWorkspaceConditions = (ctx: TPowerKContext) => Boolean(ctx.params.workspaceSlug?.toString());
  const baseProjectConditions = (ctx: TPowerKContext) =>
    Boolean(ctx.params.workspaceSlug?.toString() && ctx.params.projectId?.toString());
  const getContextProject = (ctx: TPowerKContext) => getPartialProjectById(ctx.params.projectId?.toString());

  return {
    open_workspace: {
      id: "open_workspace",
      type: "change-page",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.open_workspace",
      icon: Briefcase,
      keySequence: "ow",
      page: "open-workspace",
      onSelect: (data, ctx) => {
        const workspaceDetails = data as IWorkspace;
        handlePowerKNavigate(ctx, [workspaceDetails.slug]);
      },
      isEnabled: (ctx) => baseWorkspaceConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx),
      closeOnSelect: true,
    },
    nav_home: {
      id: "nav_home",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_home",
      icon: Home,
      keySequence: "gh",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString()]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx),
      closeOnSelect: true,
    },
    nav_inbox: {
      id: "nav_inbox",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_inbox",
      icon: Inbox,
      keySequence: "gx",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "notifications"]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx),
      closeOnSelect: true,
    },
    nav_your_work: {
      id: "nav_your_work",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_your_work",
      icon: UserActivityIcon,
      keySequence: "gy",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "profile", currentUser?.id]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx) && hasWorkspaceMemberLevelPermissions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx) && hasWorkspaceMemberLevelPermissions(ctx),
      closeOnSelect: true,
    },
    nav_account_settings: {
      id: "nav_account_settings",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_account_settings",
      icon: Settings,
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "settings", "account"]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx),
      closeOnSelect: true,
    },
    open_project: {
      id: "open_project",
      type: "change-page",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.open_project",
      icon: Briefcase,
      keySequence: "op",
      page: "open-project",
      onSelect: (data, ctx) => {
        const projectDetails = data as IPartialProject;
        handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "projects", projectDetails.id, "issues"]);
      },
      isEnabled: (ctx) => baseWorkspaceConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx),
      closeOnSelect: true,
    },
    nav_projects_list: {
      id: "nav_projects_list",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_projects_list",
      icon: Briefcase,
      keySequence: "gp",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "projects"]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx),
      closeOnSelect: true,
    },
    nav_all_workspace_work_items: {
      id: "nav_all_workspace_work_items",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_all_workspace_work_items",
      icon: Layers,
      action: (ctx) =>
        handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "workspace-views", "all-issues"]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx),
      closeOnSelect: true,
    },
    nav_assigned_workspace_work_items: {
      id: "nav_assigned_workspace_work_items",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_assigned_workspace_work_items",
      icon: Layers,
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "workspace-views", "assigned"]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx),
      closeOnSelect: true,
    },
    nav_created_workspace_work_items: {
      id: "nav_created_workspace_work_items",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_created_workspace_work_items",
      icon: Layers,
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "workspace-views", "created"]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx),
      closeOnSelect: true,
    },
    nav_subscribed_workspace_work_items: {
      id: "nav_subscribed_workspace_work_items",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_subscribed_workspace_work_items",
      icon: Layers,
      action: (ctx) =>
        handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "workspace-views", "subscribed"]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx),
      closeOnSelect: true,
    },
    nav_workspace_analytics: {
      id: "nav_workspace_analytics",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_workspace_analytics",
      icon: BarChart2,
      keySequence: "ga",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "analytics", "overview"]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx) && hasWorkspaceMemberLevelPermissions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx) && hasWorkspaceMemberLevelPermissions(ctx),
      closeOnSelect: true,
    },
    nav_workspace_drafts: {
      id: "nav_workspace_drafts",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_workspace_drafts",
      icon: PenSquare,
      keySequence: "gj",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "drafts"]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx) && hasWorkspaceMemberLevelPermissions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx) && hasWorkspaceMemberLevelPermissions(ctx),
      closeOnSelect: true,
    },
    nav_workspace_archives: {
      id: "nav_workspace_archives",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_workspace_archives",
      icon: ArchiveIcon,
      keySequence: "gr",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "projects", "archives"]),
      isEnabled: (ctx) =>
        baseWorkspaceConditions(ctx) && !baseProjectConditions(ctx) && hasWorkspaceMemberLevelPermissions(ctx),
      isVisible: (ctx) =>
        baseWorkspaceConditions(ctx) && !baseProjectConditions(ctx) && hasWorkspaceMemberLevelPermissions(ctx),
      closeOnSelect: true,
    },
    open_workspace_setting: {
      id: "open_workspace_setting",
      type: "change-page",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.open_workspace_setting",
      icon: Settings,
      keySequence: "os",
      page: "open-workspace-setting",
      onSelect: (data, ctx) => {
        const settingsHref = data as string;
        handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), settingsHref]);
      },
      isEnabled: (ctx) => baseWorkspaceConditions(ctx) && !baseProjectConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx) && !baseProjectConditions(ctx),
      closeOnSelect: true,
    },
    nav_workspace_settings: {
      id: "nav_workspace_settings",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_workspace_settings",
      icon: Settings,
      keySequence: "gs",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "settings"]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx) && !baseProjectConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx) && !baseProjectConditions(ctx),
      closeOnSelect: true,
    },
    nav_project_work_items: {
      id: "nav_project_work_items",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_project_work_items",
      icon: LayersIcon,
      keySequence: "gi",
      action: (ctx) =>
        handlePowerKNavigate(ctx, [
          ctx.params.workspaceSlug?.toString(),
          "projects",
          ctx.params.projectId?.toString(),
          "issues",
        ]),
      isEnabled: (ctx) => baseProjectConditions(ctx),
      isVisible: (ctx) => baseProjectConditions(ctx),
      closeOnSelect: true,
    },
    open_project_cycle: {
      id: "open_project_cycle",
      type: "change-page",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.open_project_cycle",
      icon: ContrastIcon,
      keySequence: "oc",
      page: "open-project-cycle",
      onSelect: (data, ctx) => {
        const cycleDetails = data as ICycle;
        handlePowerKNavigate(ctx, [
          ctx.params.workspaceSlug?.toString(),
          "projects",
          ctx.params.projectId?.toString(),
          "cycles",
          cycleDetails.id,
        ]);
      },
      isEnabled: (ctx) =>
        baseProjectConditions(ctx) && hasProjectMemberLevelPermissions(ctx) && !!getContextProject(ctx)?.cycle_view,
      isVisible: (ctx) =>
        baseProjectConditions(ctx) && hasProjectMemberLevelPermissions(ctx) && !!getContextProject(ctx)?.cycle_view,
      closeOnSelect: true,
    },
    nav_project_cycles: {
      id: "nav_project_cycles",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_project_cycles",
      icon: ContrastIcon,
      keySequence: "gc",
      action: (ctx) =>
        handlePowerKNavigate(ctx, [
          ctx.params.workspaceSlug?.toString(),
          "projects",
          ctx.params.projectId?.toString(),
          "cycles",
        ]),
      isEnabled: (ctx) =>
        baseProjectConditions(ctx) && hasProjectMemberLevelPermissions(ctx) && !!getContextProject(ctx)?.cycle_view,
      isVisible: (ctx) =>
        baseProjectConditions(ctx) && hasProjectMemberLevelPermissions(ctx) && !!getContextProject(ctx)?.cycle_view,
      closeOnSelect: true,
    },
    open_project_module: {
      id: "open_project_module",
      type: "change-page",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.open_project_module",
      icon: DiceIcon,
      keySequence: "om",
      page: "open-project-module",
      onSelect: (data, ctx) => {
        const moduleDetails = data as IModule;
        handlePowerKNavigate(ctx, [
          ctx.params.workspaceSlug?.toString(),
          "projects",
          ctx.params.projectId?.toString(),
          "modules",
          moduleDetails.id,
        ]);
      },
      isEnabled: (ctx) =>
        baseProjectConditions(ctx) && hasProjectMemberLevelPermissions(ctx) && !!getContextProject(ctx)?.module_view,
      isVisible: (ctx) =>
        baseProjectConditions(ctx) && hasProjectMemberLevelPermissions(ctx) && !!getContextProject(ctx)?.module_view,
      closeOnSelect: true,
    },
    nav_project_modules: {
      id: "nav_project_modules",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_project_modules",
      icon: DiceIcon,
      keySequence: "gm",
      action: (ctx) =>
        handlePowerKNavigate(ctx, [
          ctx.params.workspaceSlug?.toString(),
          "projects",
          ctx.params.projectId?.toString(),
          "modules",
        ]),
      isEnabled: (ctx) =>
        baseProjectConditions(ctx) && hasProjectMemberLevelPermissions(ctx) && !!getContextProject(ctx)?.module_view,
      isVisible: (ctx) =>
        baseProjectConditions(ctx) && hasProjectMemberLevelPermissions(ctx) && !!getContextProject(ctx)?.module_view,
      closeOnSelect: true,
    },
    open_project_view: {
      id: "open_project_view",
      type: "change-page",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.open_project_view",
      icon: Layers,
      keySequence: "ov",
      page: "open-project-view",
      onSelect: (data, ctx) => {
        const viewDetails = data as IProjectView;
        handlePowerKNavigate(ctx, [
          ctx.params.workspaceSlug?.toString(),
          "projects",
          ctx.params.projectId?.toString(),
          "views",
          viewDetails.id,
        ]);
      },
      isEnabled: (ctx) => baseProjectConditions(ctx) && !!getContextProject(ctx)?.issue_views_view,
      isVisible: (ctx) => baseProjectConditions(ctx) && !!getContextProject(ctx)?.issue_views_view,
      closeOnSelect: true,
    },
    nav_project_views: {
      id: "nav_project_views",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_project_views",
      icon: Layers,
      keySequence: "gv",
      action: (ctx) =>
        handlePowerKNavigate(ctx, [
          ctx.params.workspaceSlug?.toString(),
          "projects",
          ctx.params.projectId?.toString(),
          "views",
        ]),
      isEnabled: (ctx) => baseProjectConditions(ctx) && !!getContextProject(ctx)?.issue_views_view,
      isVisible: (ctx) => baseProjectConditions(ctx) && !!getContextProject(ctx)?.issue_views_view,
      closeOnSelect: true,
    },
    nav_project_pages: {
      id: "nav_project_pages",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_project_pages",
      icon: FileText,
      keySequence: "gd",
      action: (ctx) =>
        handlePowerKNavigate(ctx, [
          ctx.params.workspaceSlug?.toString(),
          "projects",
          ctx.params.projectId?.toString(),
          "pages",
        ]),
      isEnabled: (ctx) => baseProjectConditions(ctx) && !!getContextProject(ctx)?.page_view,
      isVisible: (ctx) => baseProjectConditions(ctx) && !!getContextProject(ctx)?.page_view,
      closeOnSelect: true,
    },
    nav_project_intake: {
      id: "nav_project_intake",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_project_intake",
      icon: Intake,
      keySequence: "gk",
      action: (ctx) =>
        handlePowerKNavigate(ctx, [
          ctx.params.workspaceSlug?.toString(),
          "projects",
          ctx.params.projectId?.toString(),
          "intake",
        ]),
      isEnabled: (ctx) => baseProjectConditions(ctx) && !!getContextProject(ctx)?.inbox_view,
      isVisible: (ctx) => baseProjectConditions(ctx) && !!getContextProject(ctx)?.inbox_view,
      closeOnSelect: true,
    },
    nav_project_archives: {
      id: "nav_project_archives",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_project_archives",
      icon: ArchiveIcon,
      keySequence: "gr",
      action: (ctx) =>
        handlePowerKNavigate(ctx, [
          ctx.params.workspaceSlug?.toString(),
          "projects",
          ctx.params.projectId?.toString(),
          "archives",
          "issues",
        ]),
      isEnabled: (ctx) => baseProjectConditions(ctx) && hasProjectMemberLevelPermissions(ctx),
      isVisible: (ctx) => baseProjectConditions(ctx) && hasProjectMemberLevelPermissions(ctx),
      closeOnSelect: true,
    },
    open_project_setting: {
      id: "open_project_setting",
      type: "change-page",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.open_project_setting",
      icon: Settings,
      keySequence: "os",
      page: "open-project-setting",
      onSelect: (data, ctx) => {
        const settingsHref = data as string;
        handlePowerKNavigate(ctx, [
          ctx.params.workspaceSlug?.toString(),
          "settings",
          "projects",
          ctx.params.projectId?.toString(),
          settingsHref,
        ]);
      },
      isEnabled: (ctx) => baseProjectConditions(ctx),
      isVisible: (ctx) => baseProjectConditions(ctx),
      closeOnSelect: true,
    },
    nav_project_settings: {
      id: "nav_project_settings",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_project_settings",
      icon: Settings,
      keySequence: "gs",
      action: (ctx) =>
        handlePowerKNavigate(ctx, [
          ctx.params.workspaceSlug?.toString(),
          "settings",
          "projects",
          ctx.params.projectId?.toString(),
        ]),
      isEnabled: (ctx) => baseProjectConditions(ctx),
      isVisible: (ctx) => baseProjectConditions(ctx),
      closeOnSelect: true,
    },
  };
};
