import { posthog } from "posthog-js";
import { EUserPermissions } from "@plane/types";
import type { EUserProjectRoles, EUserWorkspaceRoles, IUser, IWorkspace, TUserProfile } from "@plane/types";

type TUserRole = "guest" | "member" | "admin" | "unknown";

/**
 * ============================================================================
 * Utilities
 * ============================================================================
 */

/**
 * Get the user role string from the user role enum
 * @param role - The user role enum
 * @returns The user role string
 */

const getUserRoleString = (role: EUserPermissions | EUserWorkspaceRoles | EUserProjectRoles | undefined): TUserRole => {
  if (!role) return "unknown";
  switch (role) {
    case EUserPermissions.GUEST:
      return "guest";
    case EUserPermissions.MEMBER:
      return "member";
    case EUserPermissions.ADMIN:
      return "admin";
    default:
      return "unknown";
  }
};

/**
 * ============================================================================
 * USER IDENTIFICATION
 * ============================================================================
 */

/**
 * Identify a user in PostHog with all required person properties
 * Call this after signup, login, or whenever session becomes authenticated
 *
 * @param user - User object from the store
 * @param profile - Optional user profile object (for onboarding status, role, use_case)
 */

export const identifyUser = (user: IUser, profile?: TUserProfile) => {
  if (!posthog || !user) return;

  posthog.identify(user.id, {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    display_name: user.display_name,
    date_joined: user.date_joined,
    last_login_medium: user.last_login_medium || "EMAIL",
    timezone: user.user_timezone,
    is_email_verified: user.is_email_verified,
    is_onboarded: profile?.is_onboarded || false,
    role: profile?.role || null,
    use_case: profile?.use_case || null,
    last_workspace_id: user.last_workspace_id || null,
    language: profile?.language || null,
    last_login_time: user.last_login_time || null,
  });
};

/**
 * ============================================================================
 * WORKSPACE GROUP TRACKING
 * ============================================================================
 */

/**
 * Join workspace group properties in PostHog
 * Call this whenever a user views a workspace (e.g., on workspace switch)
 *
 * @param workspace - Workspace object
 */
export const joinWorkspaceGroup = (workspace: Partial<IWorkspace>) => {
  if (!posthog || !workspace.slug) return;

  posthog.group("workspace", workspace.slug, {
    workspace_id: workspace.id,
    workspace_name: workspace.name,
    workspace_slug: workspace.slug,
    workspace_size: workspace.organization_size,
    created_at: workspace.created_at instanceof Date ? workspace.created_at.toISOString() : workspace.created_at,
    owner_user_id: workspace.owner?.id || workspace.created_by,
    is_deleted: false,
    deleted_at: null,
  });
};

/**
 * ============================================================================
 * GENERIC EVENT TRACKING
 * ============================================================================
 */

/**
 * Generic event tracking function with workspace context
 * All workspace events must include workspace_id, role, and groups
 *
 * @param eventName - Event name in snake_case (e.g., "workspace_created")
 * @param properties - Event-specific properties
 * @param workspaceSlug - Workspace slug for group association
 * @param role - User's role in the workspace
 */
export const trackEvent = (eventName: string, properties: Record<string, unknown>, role: TUserRole) => {
  if (!posthog) return;

  const eventProperties = {
    ...properties,
    role: role || "unknown",
  };

  posthog.capture(eventName, eventProperties);
};

/**
 * ============================================================================
 * LIFECYCLE EVENTS
 * ============================================================================
 */

/**
 * Track workspace creation
 * Call this immediately after a workspace is created
 */
export const trackWorkspaceCreated = (
  workspace: IWorkspace,
  user: IUser,
  role: EUserPermissions | EUserWorkspaceRoles | undefined,
  extraProperties?: Record<string, unknown>
) => {
  const userRole = getUserRoleString(role);
  joinWorkspaceGroup(workspace);
  trackEvent(
    "workspace_created",
    {
      id: user.id,
      workspace_id: workspace.id,
      workspace_slug: workspace.slug,
      workspace_name: workspace.name,
      created_at: workspace.created_at instanceof Date ? workspace.created_at.toISOString() : workspace.created_at,
      ...extraProperties,
    },
    userRole
  );
};

/**
 * Track workspace deletion
 */
export const trackWorkspaceDeleted = (
  workspace: IWorkspace,
  user: IUser,
  role: EUserPermissions | EUserWorkspaceRoles | undefined
) => {
  const userRole = getUserRoleString(role);
  trackEvent(
    "workspace_deleted",
    {
      id: user.id,
      workspace_id: workspace.id,
      workspace_slug: workspace.slug,
      deleted_at: new Date().toISOString(),
    },
    userRole
  );
};

/**
 * ============================================================================
 * PRODUCT ACTIVATION EVENTS
 * ============================================================================
 */

/**
 * Track project creation
 */
export const trackProjectCreated = (
  project: { id: string; created_at: string | Date },
  workspace: IWorkspace,
  user: IUser,
  role: EUserPermissions | EUserWorkspaceRoles | undefined
) => {
  const userRole = getUserRoleString(role);
  trackEvent(
    "project_created",
    {
      id: user.id,
      workspace_id: workspace.id,
      workspace_slug: workspace.slug,
      project_id: project.id,
      created_at: project.created_at instanceof Date ? project.created_at.toISOString() : project.created_at,
    },
    userRole
  );
};

/**
 * Track work item creation
 */
export const trackWorkItemCreated = (
  workItem: { id: string; type?: string; created_at: string | Date },
  project: { id: string },
  workspace: IWorkspace,
  user: IUser,
  role: EUserPermissions | EUserWorkspaceRoles | undefined
) => {
  const userRole = getUserRoleString(role);
  trackEvent(
    "work_item_created",
    {
      id: user.id,
      workspace_id: workspace.id,
      workspace_slug: workspace.slug,
      project_id: project.id,
      work_item_id: workItem.id,
      work_item_type: workItem.type,
      created_at: workItem.created_at instanceof Date ? workItem.created_at.toISOString() : workItem.created_at,
    },
    userRole
  );
};

/**
 * Track cycle creation
 */
export const trackCycleCreated = (
  cycle: { id: string; length_days?: number; created_at: string | Date },
  project: { id: string },
  workspace: IWorkspace,
  user: IUser,
  role: EUserPermissions | EUserWorkspaceRoles | undefined
) => {
  const userRole = getUserRoleString(role);
  trackEvent(
    "cycle_created",
    {
      id: user.id,
      workspace_id: workspace.id,
      workspace_slug: workspace.slug,
      project_id: project.id,
      cycle_id: cycle.id,
      cycle_length_days: cycle.length_days || null,
      created_at: cycle.created_at instanceof Date ? cycle.created_at.toISOString() : cycle.created_at,
    },
    userRole
  );
};

/**
 * Track page creation
 */
export const trackPageCreated = (
  page: { id: string; created_at: string | Date; project_id?: string | null },
  workspace: IWorkspace,
  user: IUser,
  location: "project" | "wiki" | "teamspace" | "workitem",
  role: EUserPermissions | EUserWorkspaceRoles | undefined
) => {
  const userRole = getUserRoleString(role);
  trackEvent(
    "page_created",
    {
      id: user.id,
      workspace_id: workspace.id,
      workspace_slug: workspace.slug,
      page_id: page.id,
      location,
      project_id: page.project_id || null,
      created_at: page.created_at instanceof Date ? page.created_at.toISOString() : page.created_at,
    },
    userRole
  );
};
