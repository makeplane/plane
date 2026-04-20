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

// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import type { PermissionMatrixGroup } from "@plane/constants";
import type { PermissionNamespace } from "@plane/types";
// hooks
import { useFeatureFlags } from "@/plane-web/hooks/store";

/**
 * Context passed to each group/row visibility check.
 * Add fields here as new check types are needed (e.g., projectId for project-scoped checks).
 */
type PermissionGroupAccessContext = {
  workspaceSlug: string;
  getFeatureFlag: (workspaceSlug: string, flag: E_FEATURE_FLAGS, defaultValue: boolean) => boolean;
};

/**
 * A single composable check function.
 * Returns `true` if the group or row should be visible.
 */
type PermissionGroupCheck = (ctx: PermissionGroupAccessContext) => boolean;

/**
 * Maps workspace group keys → checks that ALL must pass for the group to be visible.
 *
 * To add a new check: add an entry keyed by `group.key` with an array of check functions.
 * Multiple checks are combined with AND semantics — all must return true.
 * Groups without an entry here are always visible.
 */
const WORKSPACE_GROUP_CHECKS: Partial<Record<string, PermissionGroupCheck[]>> = {
  initiatives: [(ctx) => ctx.getFeatureFlag(ctx.workspaceSlug, E_FEATURE_FLAGS.INITIATIVES, false)],
  teamspaces: [(ctx) => ctx.getFeatureFlag(ctx.workspaceSlug, E_FEATURE_FLAGS.TEAMSPACES, false)],
  customers: [(ctx) => ctx.getFeatureFlag(ctx.workspaceSlug, E_FEATURE_FLAGS.CUSTOMERS, false)],
};

/**
 * Maps project group keys → checks that ALL must pass for the group to be visible.
 */
const PROJECT_GROUP_CHECKS: Partial<Record<string, PermissionGroupCheck[]>> = {
  epics: [(ctx) => ctx.getFeatureFlag(ctx.workspaceSlug, E_FEATURE_FLAGS.EPICS, false)],
  project_updates: [(ctx) => ctx.getFeatureFlag(ctx.workspaceSlug, E_FEATURE_FLAGS.PROJECT_UPDATES, false)],
};

/**
 * Composable access filter for permission matrix groups.
 *
 * Similar to `useWorkspaceAccess` / `useProjectAccess`, this hook encapsulates
 * all visibility logic for permission groups in one place. The UI stays dumb:
 * it calls `filterGroups` and renders whatever comes back.
 *
 * To add a new gate (feature flag, permission check, or custom predicate):
 * add a function to the relevant `*_GROUP_CHECKS` map above — no UI changes needed.
 */
export const usePermissionGroupAccess = (workspaceSlug: string, namespace: PermissionNamespace) => {
  const { getFeatureFlag: storeGetFeatureFlag } = useFeatureFlags();

  const filterGroups = (groups: PermissionMatrixGroup[]): PermissionMatrixGroup[] => {
    const checksMap = namespace === "workspace" ? WORKSPACE_GROUP_CHECKS : PROJECT_GROUP_CHECKS;
    const ctx: PermissionGroupAccessContext = {
      workspaceSlug,
      getFeatureFlag: (ws, flag, defaultValue) => storeGetFeatureFlag(ws, flag, defaultValue),
    };

    return groups.filter((group) => {
      const checks = checksMap[group.key];
      if (!checks || checks.length === 0) return true; // no checks = always visible
      return checks.every((check) => check(ctx));
    });
  };

  return { filterGroups };
};
