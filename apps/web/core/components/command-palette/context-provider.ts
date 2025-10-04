"use client";

import { CommandContext, RouteContext } from "./types";

/**
 * Utility functions for building and managing command context
 */

/**
 * Determine the current route context from pathname
 */
export function determineRouteContext(pathname: string): RouteContext {
  // Issue context - when viewing a specific work item
  if (pathname.includes('/work-item/') || pathname.match(/\/-\//)) {
    return 'issue';
  }

  // Cycle context - when viewing a specific cycle
  if (pathname.includes('/cycles/') && pathname.split('/').filter(Boolean).length > 5) {
    return 'cycle';
  }

  // Module context - when viewing a specific module
  if (pathname.includes('/modules/') && pathname.split('/').filter(Boolean).length > 5) {
    return 'module';
  }

  // Page context - when viewing a specific page
  if (pathname.includes('/pages/') && pathname.split('/').filter(Boolean).length > 5) {
    return 'page';
  }

  // View context - when viewing a specific view
  if (pathname.includes('/views/') && pathname.split('/').filter(Boolean).length > 5) {
    return 'view';
  }

  // Project context - when in a project but not viewing specific entity
  if (pathname.includes('/projects/') && pathname.split('/').filter(Boolean).length > 3) {
    return 'project';
  }

  // Default to workspace context
  return 'workspace';
}

/**
 * Build command context from route params and permissions
 */
export function buildCommandContext(params: {
  workspaceSlug?: string;
  projectId?: string;
  issueId?: string;
  cycleId?: string;
  moduleId?: string;
  pageId?: string;
  viewId?: string;
  pathname?: string;
  canPerformAnyCreateAction?: boolean;
  canPerformWorkspaceActions?: boolean;
  canPerformProjectActions?: boolean;
}): CommandContext {
  const {
    workspaceSlug,
    projectId,
    issueId,
    cycleId,
    moduleId,
    pageId,
    viewId,
    pathname = '',
    canPerformAnyCreateAction = false,
    canPerformWorkspaceActions = false,
    canPerformProjectActions = false,
  } = params;

  const routeContext = determineRouteContext(pathname);
  const isWorkspaceLevel = !projectId;

  return {
    workspaceSlug,
    projectId,
    issueId,
    cycleId,
    moduleId,
    pageId,
    viewId,
    routeContext,
    isWorkspaceLevel,
    canPerformAnyCreateAction,
    canPerformWorkspaceActions,
    canPerformProjectActions,
    stepData: {},
  };
}

/**
 * Update context with step data (used during multi-step flows)
 */
export function updateContextWithStepData(
  context: CommandContext,
  stepData: Record<string, any>
): CommandContext {
  return {
    ...context,
    stepData: {
      ...context.stepData,
      ...stepData,
    },
  };
}

/**
 * Check if a specific entity context is available
 */
export function hasEntityContext(context: CommandContext, entity: 'project' | 'issue' | 'cycle' | 'module' | 'page' | 'view'): boolean {
  switch (entity) {
    case 'project':
      return Boolean(context.projectId);
    case 'issue':
      return Boolean(context.issueId);
    case 'cycle':
      return Boolean(context.cycleId);
    case 'module':
      return Boolean(context.moduleId);
    case 'page':
      return Boolean(context.pageId);
    case 'view':
      return Boolean(context.viewId);
    default:
      return false;
  }
}

/**
 * Get breadcrumb information from context
 */
export function getContextBreadcrumbs(context: CommandContext): string[] {
  const breadcrumbs: string[] = [];

  if (context.workspaceSlug) {
    breadcrumbs.push(context.workspaceSlug);
  }

  if (context.projectId) {
    breadcrumbs.push('project');
  }

  switch (context.routeContext) {
    case 'issue':
      breadcrumbs.push('issue');
      break;
    case 'cycle':
      breadcrumbs.push('cycle');
      break;
    case 'module':
      breadcrumbs.push('module');
      break;
    case 'page':
      breadcrumbs.push('page');
      break;
    case 'view':
      breadcrumbs.push('view');
      break;
  }

  return breadcrumbs;
}

/**
 * Check if context has required permissions for an action
 */
export function hasPermission(
  context: CommandContext,
  required: 'create' | 'workspace-admin' | 'project-admin'
): boolean {
  switch (required) {
    case 'create':
      return Boolean(context.canPerformAnyCreateAction);
    case 'workspace-admin':
      return Boolean(context.canPerformWorkspaceActions);
    case 'project-admin':
      return Boolean(context.canPerformProjectActions);
    default:
      return false;
  }
}
