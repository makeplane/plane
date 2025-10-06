import { BarChart2, Briefcase, FileText, Home, Inbox, Layers, PenSquare, Settings } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { ArchiveIcon, UserActivityIcon, LayersIcon, ContrastIcon, DiceIcon, Intake } from "@plane/propel/icons";
import {
  EUserProjectRoles,
  EUserWorkspaceRoles,
  ICycle,
  IModule,
  IPartialProject,
  IProjectView,
  IWorkspace,
} from "@plane/types";
// components
import type { TPowerKCommandConfig, TPowerKContext } from "@/components/power-k/core/types";
import { handlePowerKNavigate } from "@/components/power-k/utils/navigation";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";

export type TPowerKNavigationCommandKeys =
  | "open-workspace"
  | "nav-home"
  | "nav-inbox"
  | "nav-your-work"
  | "nav-account-settings"
  | "open-project"
  | "nav-projects-list"
  | "nav-all-workspace-work-items"
  | "nav-assigned-workspace-work-items"
  | "nav-created-workspace-work-items"
  | "nav-subscribed-workspace-work-items"
  | "nav-workspace-analytics"
  | "nav-workspace-drafts"
  | "nav-workspace-archives"
  | "open-workspace-setting"
  | "nav-workspace-settings"
  | "nav-project-work-items"
  | "open-project-cycle"
  | "nav-project-cycles"
  | "open-project-module"
  | "nav-project-modules"
  | "open-project-view"
  | "nav-project-views"
  | "nav-project-pages"
  | "nav-project-intake"
  | "nav-project-archives"
  | "open-project-setting"
  | "nav-project-settings";

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
    "open-workspace": {
      id: "open-workspace",
      type: "change-page",
      group: "navigation",
      i18n_title: "Open a workspace",
      i18n_description: "Open a workspace",
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
    "nav-home": {
      id: "nav-home",
      type: "action",
      group: "navigation",
      i18n_title: "Go to home",
      i18n_description: "Navigate to workspace home",
      icon: Home,
      keySequence: "gh",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString()]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx),
      closeOnSelect: true,
    },
    "nav-inbox": {
      id: "nav-inbox",
      type: "action",
      group: "navigation",
      i18n_title: "Go to inbox",
      i18n_description: "Navigate to your inbox",
      icon: Inbox,
      keySequence: "gi",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "notifications"]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx),
      closeOnSelect: true,
    },
    "nav-your-work": {
      id: "nav-your-work",
      type: "action",
      group: "navigation",
      i18n_title: "Go to your work",
      i18n_description: "Navigate to your work",
      icon: UserActivityIcon,
      keySequence: "gy",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "profile", currentUser?.id]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx) && hasWorkspaceMemberLevelPermissions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx) && hasWorkspaceMemberLevelPermissions(ctx),
      closeOnSelect: true,
    },
    "nav-account-settings": {
      id: "nav-account-settings",
      type: "action",
      group: "navigation",
      i18n_title: "Go to account settings",
      i18n_description: "Navigate to account settings",
      icon: Settings,
      keySequence: "gsa",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "settings", "account"]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx),
      closeOnSelect: true,
    },
    "open-project": {
      id: "open-project",
      type: "change-page",
      group: "navigation",
      i18n_title: "Open a project",
      i18n_description: "Open a project",
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
    "nav-projects-list": {
      id: "nav-projects-list",
      type: "action",
      group: "navigation",
      i18n_title: "Go to projects list",
      i18n_description: "Navigate to projects list",
      icon: Briefcase,
      keySequence: "gpl",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "projects"]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx),
      closeOnSelect: true,
    },
    "nav-all-workspace-work-items": {
      id: "nav-all-workspace-work-items",
      type: "action",
      group: "navigation",
      i18n_title: "Go to all workspace work items",
      i18n_description: "Navigate to all workspace work items",
      icon: Layers,
      keySequence: "ggw",
      action: (ctx) =>
        handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "workspace-views", "all-issues"]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx),
      closeOnSelect: true,
    },
    "nav-assigned-workspace-work-items": {
      id: "nav-assigned-workspace-work-items",
      type: "action",
      group: "navigation",
      i18n_title: "Go to assigned workspace work items",
      i18n_description: "Navigate to assigned workspace work items",
      icon: Layers,
      keySequence: "gga",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "workspace-views", "assigned"]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx),
      closeOnSelect: true,
    },
    "nav-created-workspace-work-items": {
      id: "nav-created-workspace-work-items",
      type: "action",
      group: "navigation",
      i18n_title: "Go to created workspace work items",
      i18n_description: "Navigate to created workspace work items",
      icon: Layers,
      keySequence: "ggc",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "workspace-views", "created"]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx),
      closeOnSelect: true,
    },
    "nav-subscribed-workspace-work-items": {
      id: "nav-subscribed-workspace-work-items",
      type: "action",
      group: "navigation",
      i18n_title: "Go to subscribed workspace work items",
      i18n_description: "Navigate to subscribed workspace work items",
      icon: Layers,
      keySequence: "ggs",
      action: (ctx) =>
        handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "workspace-views", "subscribed"]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx),
      closeOnSelect: true,
    },
    "nav-workspace-analytics": {
      id: "nav-workspace-analytics",
      type: "action",
      group: "navigation",
      i18n_title: "Go to workspace analytics",
      i18n_description: "Navigate to workspace analytics",
      icon: BarChart2,
      keySequence: "ga",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "analytics", "overview"]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx) && hasWorkspaceMemberLevelPermissions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx) && hasWorkspaceMemberLevelPermissions(ctx),
      closeOnSelect: true,
    },
    "nav-workspace-drafts": {
      id: "nav-workspace-drafts",
      type: "action",
      group: "navigation",
      i18n_title: "Go to workspace drafts",
      i18n_description: "Navigate to workspace drafts",
      icon: PenSquare,
      keySequence: "gd",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "drafts"]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx) && hasWorkspaceMemberLevelPermissions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx) && hasWorkspaceMemberLevelPermissions(ctx),
      closeOnSelect: true,
    },
    "nav-workspace-archives": {
      id: "nav-workspace-archives",
      type: "action",
      group: "navigation",
      i18n_title: "Go to workspace archives",
      i18n_description: "Navigate to workspace archives",
      icon: ArchiveIcon,
      keySequence: "ga",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "projects", "archives"]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx) && hasWorkspaceMemberLevelPermissions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx) && hasWorkspaceMemberLevelPermissions(ctx),
      closeOnSelect: true,
    },
    "open-workspace-setting": {
      id: "open-workspace-setting",
      type: "change-page",
      group: "navigation",
      i18n_title: "Open a workspace settings",
      i18n_description: "Navigate to workspace settings",
      icon: Settings,
      keySequence: "osw",
      page: "open-workspace-setting",
      onSelect: (data, ctx) => {
        const settingsHref = data as string;
        handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), settingsHref]);
      },
      isEnabled: (ctx) => baseWorkspaceConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx),
      closeOnSelect: true,
    },
    "nav-workspace-settings": {
      id: "nav-workspace-settings",
      type: "action",
      group: "navigation",
      i18n_title: "Go to workspace settings",
      i18n_description: "Navigate to workspace settings",
      icon: Settings,
      keySequence: "gsw",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "settings"]),
      isEnabled: (ctx) => baseWorkspaceConditions(ctx),
      isVisible: (ctx) => baseWorkspaceConditions(ctx),
      closeOnSelect: true,
    },
    "nav-project-work-items": {
      id: "nav-project-work-items",
      type: "action",
      group: "navigation",
      i18n_title: "Go to project work items",
      i18n_description: "Navigate to project work items",
      icon: LayersIcon,
      keySequence: "gpw",
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
    "open-project-cycle": {
      id: "open-project-cycle",
      type: "change-page",
      group: "navigation",
      i18n_title: "Open a project cycle",
      i18n_description: "Navigate to project cycles",
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
    "nav-project-cycles": {
      id: "nav-project-cycles",
      type: "action",
      group: "navigation",
      i18n_title: "Go to project cycles",
      i18n_description: "Navigate to project cycles",
      icon: ContrastIcon,
      keySequence: "gpc",
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
    "open-project-module": {
      id: "open-project-module",
      type: "change-page",
      group: "navigation",
      i18n_title: "Open a project module",
      i18n_description: "Navigate to project modules",
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
    "nav-project-modules": {
      id: "nav-project-modules",
      type: "action",
      group: "navigation",
      i18n_title: "Go to project modules",
      i18n_description: "Navigate to project modules",
      icon: DiceIcon,
      keySequence: "gpm",
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
    "open-project-view": {
      id: "open-project-view",
      type: "change-page",
      group: "navigation",
      i18n_title: "Open a project view",
      i18n_description: "Navigate to project views",
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
    "nav-project-views": {
      id: "nav-project-views",
      type: "action",
      group: "navigation",
      i18n_title: "Go to project views",
      i18n_description: "Navigate to project views",
      icon: Layers,
      keySequence: "gpv",
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
    "nav-project-pages": {
      id: "nav-project-pages",
      type: "action",
      group: "navigation",
      i18n_title: "Go to project pages",
      i18n_description: "Navigate to project pages",
      icon: FileText,
      keySequence: "gpp",
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
    "nav-project-intake": {
      id: "nav-project-intake",
      type: "action",
      group: "navigation",
      i18n_title: "Go to project intake",
      i18n_description: "Navigate to project intake",
      icon: Intake,
      keySequence: "gpi",
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
    "nav-project-archives": {
      id: "nav-project-archives",
      type: "action",
      group: "navigation",
      i18n_title: "Go to project archives",
      i18n_description: "Navigate to project archives",
      icon: ArchiveIcon,
      keySequence: "gpa",
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
    "open-project-setting": {
      id: "open-project-setting",
      type: "change-page",
      group: "navigation",
      i18n_title: "Open a project settings",
      i18n_description: "Navigate to project settings",
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
    "nav-project-settings": {
      id: "nav-project-settings",
      type: "action",
      group: "navigation",
      i18n_title: "Go to project settings",
      i18n_description: "Navigate to project settings",
      icon: Settings,
      keySequence: "gps",
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
