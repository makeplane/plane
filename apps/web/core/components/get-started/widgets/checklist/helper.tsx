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

import type { PermissionCheckArgs, TGettingStartedChecklistKeys } from "@plane/types";
import type { TChecklistItem } from "../constant";

type TChecklistFeatureFlags = {
  aiChat: boolean;
};

type TChecklistResolverContext = {
  workspaceSlug: string;
  joinedProjectIds: string[];
  can: (args: PermissionCheckArgs) => boolean;
  flags: TChecklistFeatureFlags;
};

const CHECKLIST_VISIBILITY_RESOLVERS: Record<
  TGettingStartedChecklistKeys,
  (context: TChecklistResolverContext) => boolean
> = {
  project_created: ({ workspaceSlug, can }) => can({ resource: "project", action: "create", workspaceSlug }),
  project_joined: ({ workspaceSlug, can }) => !can({ resource: "project", action: "create", workspaceSlug }),
  work_item_created: ({ workspaceSlug, joinedProjectIds, can }) =>
    joinedProjectIds.some((projectId) => can({ resource: "workitem", action: "create", workspaceSlug, projectId })),
  team_members_invited: ({ workspaceSlug, can }) =>
    can({ resource: "workspace_member", action: "invite", workspaceSlug, resourceMeta: { resourceId: workspaceSlug } }),
  page_created: ({ workspaceSlug, joinedProjectIds, can }) =>
    joinedProjectIds.some((projectId) => can({ resource: "page", action: "create", workspaceSlug, projectId })),
  ai_chat_tried: ({ flags }) => flags.aiChat,
  integration_linked: ({ workspaceSlug, can }) => can({ resource: "integration", action: "create", workspaceSlug }),
  view_created: ({ workspaceSlug, joinedProjectIds, can }) =>
    joinedProjectIds.some((projectId) =>
      can({ resource: "workitem_view", action: "create", workspaceSlug, projectId })
    ),
  sticky_created: ({ workspaceSlug, can }) => can({ resource: "workspace", action: "view", workspaceSlug }),
};

export const getPermittedChecklistItems = (
  items: TChecklistItem[],
  context: TChecklistResolverContext
): TChecklistItem[] => items.filter((item) => CHECKLIST_VISIBILITY_RESOLVERS[item.id](context));
