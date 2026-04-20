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

/**
 * @description Check if a role slug represents the guest role
 */
export const isGuestRole = (roleSlug: string | undefined | null): boolean => roleSlug === "guest";

/**
 * @description Check if a project role slug falls within the workspace guest ceiling.
 * Workspace guests can only be assigned "guest" or "commenter" project roles.
 * Mirrors the backend's WORKSPACE_GUEST_PROJECT_CEILING.
 */
export const isWithinGuestCeiling = (projectRoleSlug: string): boolean =>
  projectRoleSlug === "guest" || projectRoleSlug === "commenter";

/**
 * Protected role slugs that require specific actor roles to assign.
 * Mirrors backend's PROTECTED_ROLE_SLUGS in system_roles.py.
 *
 * Key = role slug being assigned
 * Value = set of actor role slugs allowed to assign it
 */
const WORKSPACE_PROTECTED_ROLE_SLUGS: Record<string, Set<string>> = {
  owner: new Set(["owner"]),
  admin: new Set(["owner", "admin"]),
};

const PROJECT_PROTECTED_ROLE_SLUGS: Record<string, Set<string>> = {
  admin: new Set(["admin"]),
};

/**
 * @description Filter roles to only those assignable by the given actor role.
 * Roles in the protectedSlugs map require the actor to be in the allowed set.
 * Roles NOT in the map are assignable by anyone with the change_role permission.
 *
 * Callers are expected to pre-filter by status at the store boundary via
 * the role-list getters' `statusFilter` argument — this utility only applies
 * actor-role policy on top of that.
 */
const getAssignableRoles = <T extends { name: string; slug: string }>(
  allRoles: T[],
  actorRoleSlug: string | undefined | null,
  protectedSlugs: Record<string, Set<string>>
): T[] => {
  if (!actorRoleSlug) return [];
  return allRoles.filter((role) => {
    const required = protectedSlugs[role.slug];
    if (required && !required.has(actorRoleSlug)) return false;
    return true;
  });
};

/**
 * @description Filter workspace roles to only those the current user can assign.
 * Owner can assign any role. Admin can assign up to admin. Custom roles cannot assign owner or admin.
 */
export const getAssignableWorkspaceRoles = <T extends { name: string; slug: string }>(
  allRoles: T[],
  actorRoleSlug: string | undefined | null
): T[] => getAssignableRoles(allRoles, actorRoleSlug, WORKSPACE_PROTECTED_ROLE_SLUGS);

/**
 * @description Filter project roles to only those the current user can assign.
 * Admin can assign any project role. Custom roles cannot assign admin.
 */
export const getAssignableProjectRoles = <T extends { name: string; slug: string }>(
  allRoles: T[],
  actorRoleSlug: string | undefined | null
): T[] => getAssignableRoles(allRoles, actorRoleSlug, PROJECT_PROTECTED_ROLE_SLUGS);

/**
 * @description Check if the actor can manage (modify/remove) a member with the target role.
 * Mirrors backend's can_manage_role in system_roles.py.
 */
const canManageRole = (
  actorRoleSlug: string | undefined | null,
  targetRoleSlug: string | undefined | null,
  protectedSlugs: Record<string, Set<string>>
): boolean => {
  if (!actorRoleSlug || !targetRoleSlug) return false;
  const required = protectedSlugs[targetRoleSlug];
  if (required && !required.has(actorRoleSlug)) return false;
  return true;
};

/**
 * @description Check if the current user can manage a workspace member with the given role.
 * E.g. admins cannot manage owners, custom roles cannot manage owners or admins.
 */
export const canManageWorkspaceRole = (
  actorRoleSlug: string | undefined | null,
  targetRoleSlug: string | undefined | null
): boolean => canManageRole(actorRoleSlug, targetRoleSlug, WORKSPACE_PROTECTED_ROLE_SLUGS);

/**
 * @description Check if the current user can manage a project member with the given role.
 * E.g. custom roles cannot manage project admins.
 */
export const canManageProjectRole = (
  actorRoleSlug: string | undefined | null,
  targetRoleSlug: string | undefined | null
): boolean => canManageRole(actorRoleSlug, targetRoleSlug, PROJECT_PROTECTED_ROLE_SLUGS);
