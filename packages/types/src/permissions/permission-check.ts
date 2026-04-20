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

import type { PermissionConditionContextForString, PermissionConditionsForString } from "./conditions";
import type { PermissionString } from "./permission-strings";
import type {
  PermissionActionForResource,
  PermissionResource,
  ProjectPermissionResource,
  ProjectPermissionResourceActionMap,
  TeamspacePermissionResource,
  TeamspacePermissionResourceActionMap,
  WorkspacePermissionResource,
  WorkspacePermissionResourceActionMap,
} from "./resource-actions";

/**
 * Resource metadata shape for a specific resource:action permission.
 */
export type PermissionResourceMeta<P extends PermissionString> = {
  resourceId: string;
} & ([PermissionConditionsForString<P>] extends [never]
  ? { conditionContext?: undefined }
  : { conditionContext: PermissionConditionContextForString<P> });

type AllPermissionActions =
  | WorkspacePermissionResourceActionMap[WorkspacePermissionResource][number]
  | TeamspacePermissionResourceActionMap[TeamspacePermissionResource][number]
  | ProjectPermissionResourceActionMap[ProjectPermissionResource][number];

/**
 * Actions that are primarily collection-oriented.
 *
 * For these actions, `resourceMeta` is optional:
 * - omitted for true collection checks (e.g. create/submit/list-style checks)
 * - provided when a caller needs instance context while keeping the same action
 *   (e.g. project/teamspace `view` checks backed by scoped permission maps)
 */
export const COLLECTION_PERMISSION_ACTIONS = [
  "create",
  "submit",
  "view",
  "browse",
  "export",
] as const satisfies readonly AllPermissionActions[];
type CollectionPermissionAction = (typeof COLLECTION_PERMISSION_ACTIONS)[number];

type PermissionCheckArgsShared<R extends PermissionResource> = {
  resource: R;
  workspaceSlug: string;
};

export type CollectionActionsForResource<R extends PermissionResource> = Extract<
  PermissionActionForResource<R>,
  CollectionPermissionAction
>;

export type InstanceActionsForResource<R extends PermissionResource> = Exclude<
  PermissionActionForResource<R>,
  CollectionPermissionAction
>;

type PermissionCheckArgsForCollectionAction<R extends PermissionResource> = {
  [A in CollectionActionsForResource<R>]: PermissionCheckArgsShared<R> & {
    action: A;
    resourceMeta?: Partial<PermissionResourceMeta<`${R}:${A & string}` & PermissionString>>;
  };
}[CollectionActionsForResource<R>];

/**
 * Instance actions always require `resourceMeta` so checks can be evaluated
 * against a concrete resource (including condition-context lookups when needed).
 */
type PermissionCheckArgsForInstanceAction<R extends PermissionResource> = {
  [A in InstanceActionsForResource<R>]: PermissionCheckArgsShared<R> & {
    action: A;
    resourceMeta: PermissionResourceMeta<`${R}:${A & string}` & PermissionString>;
  };
}[InstanceActionsForResource<R>];

type PermissionCheckArgsForResource<R extends PermissionResource> =
  | PermissionCheckArgsForCollectionAction<R>
  | PermissionCheckArgsForInstanceAction<R>;

type WorkspacePermissionCheckArgs = {
  [R in WorkspacePermissionResource]: PermissionCheckArgsForResource<R>;
}[WorkspacePermissionResource];

type ProjectPermissionCheckArgs = {
  [R in ProjectPermissionResource]: PermissionCheckArgsForResource<R> & { projectId: string };
}[ProjectPermissionResource];

type TeamspacePermissionCheckArgs = {
  [R in TeamspacePermissionResource]: PermissionCheckArgsForResource<R> & { teamspaceId: string };
}[TeamspacePermissionResource];

/**
 * Strongly typed `can()` argument union.
 *
 * Guarantees:
 * - valid `resource` + `action` pairs only
 * - `resourceMeta` optional for collection actions and required for instance actions
 * - condition context required only for condition-enabled permissions
 * - project-scoped checks always carry `projectId`
 * - teamspace-scoped checks always carry `teamspaceId`
 */
export type PermissionCheckArgs =
  | WorkspacePermissionCheckArgs
  | ProjectPermissionCheckArgs
  | TeamspacePermissionCheckArgs;
