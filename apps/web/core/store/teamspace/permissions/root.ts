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

import { computedFn } from "mobx-utils";
import type { PermissionCheckArgs } from "@plane/types";
import { TeamspaceCommentPermissionsInstance } from "./comment";
import { TeamspaceViewPermissionsInstance } from "./view";

export type TTeamspaceProperty = "name" | "description_html" | "logo_props";

type TeamspacePermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  getTeamspaceConditionContext: (teamspaceId: string) => { lead: boolean };
  getCommentConditionContext: (teamspaceId: string, commentId: string) => { creator: boolean };
  getViewConditionContext: (teamspaceId: string, viewId: string) => { creator: boolean };
};

export interface TeamspacePermissions {
  getCanBrowse: (workspaceSlug: string) => boolean;
  getCanCreate: (workspaceSlug: string) => boolean;
  getCanView: (workspaceSlug: string, teamspaceId: string) => boolean;
  getCanEdit: (workspaceSlug: string, teamspaceId: string) => boolean;
  getCanDelete: (workspaceSlug: string, teamspaceId: string) => boolean;
  getCanManage: (workspaceSlug: string, teamspaceId: string) => boolean;
  getCanEditProperty: (workspaceSlug: string, teamspaceId: string, property: TTeamspaceProperty) => boolean;
  getCanAddMember: (workspaceSlug: string, teamspaceId: string) => boolean;
  getCanRemoveMember: (workspaceSlug: string, teamspaceId: string) => boolean;
  getCanAddProject: (workspaceSlug: string, teamspaceId: string) => boolean;
  getCanRemoveProject: (workspaceSlug: string, teamspaceId: string) => boolean;
  getCanCreateWorkItem: (workspaceSlug: string, teamspaceId: string) => boolean;
  getCanCreatePage: (workspaceSlug: string) => boolean;
  getViewPermissions: (workspaceSlug: string, teamspaceId: string) => TeamspaceViewPermissionsInstance;
  getCommentPermissions: (workspaceSlug: string, teamspaceId: string) => TeamspaceCommentPermissionsInstance;
}

export class TeamspacePermissionsInstance implements TeamspacePermissions {
  constructor(private args: TeamspacePermissionsArgs) {}

  getCanBrowse: TeamspacePermissions["getCanBrowse"] = computedFn((workspaceSlug) =>
    this.args.can({ resource: "teamspace", action: "browse", workspaceSlug })
  );

  getCanCreate: TeamspacePermissions["getCanCreate"] = computedFn((workspaceSlug) =>
    this.args.can({ resource: "teamspace", action: "create", workspaceSlug })
  );

  getCanView: TeamspacePermissions["getCanView"] = computedFn((workspaceSlug, teamspaceId) =>
    this.args.can({
      resource: "teamspace",
      action: "view",
      workspaceSlug,
      resourceMeta: {
        resourceId: teamspaceId,
      },
    })
  );

  getCanEdit: TeamspacePermissions["getCanEdit"] = computedFn((workspaceSlug, teamspaceId) =>
    this.args.can({
      resource: "teamspace",
      action: "edit",
      workspaceSlug,
      resourceMeta: {
        resourceId: teamspaceId,
        conditionContext: this.args.getTeamspaceConditionContext(teamspaceId),
      },
    })
  );

  getCanDelete: TeamspacePermissions["getCanDelete"] = computedFn((workspaceSlug, teamspaceId) =>
    this.args.can({
      resource: "teamspace",
      action: "delete",
      workspaceSlug,
      resourceMeta: {
        resourceId: teamspaceId,
        conditionContext: this.args.getTeamspaceConditionContext(teamspaceId),
      },
    })
  );

  getCanManage: TeamspacePermissions["getCanManage"] = computedFn((workspaceSlug, teamspaceId) =>
    this.args.can({
      resource: "teamspace",
      action: "manage",
      workspaceSlug,
      resourceMeta: {
        resourceId: teamspaceId,
        conditionContext: this.args.getTeamspaceConditionContext(teamspaceId),
      },
    })
  );

  getCanEditProperty: TeamspacePermissions["getCanEditProperty"] = computedFn((workspaceSlug, teamspaceId, _property) =>
    this.getCanEdit(workspaceSlug, teamspaceId)
  );

  getCanAddMember: TeamspacePermissions["getCanAddMember"] = computedFn((wSlug, id) => this.getCanManage(wSlug, id));
  getCanRemoveMember: TeamspacePermissions["getCanRemoveMember"] = computedFn((wSlug, id) =>
    this.getCanManage(wSlug, id)
  );

  // Project linking goes via PATCH teamspace → uses teamspace:edit
  getCanAddProject: TeamspacePermissions["getCanAddProject"] = computedFn((wSlug, id) => this.getCanEdit(wSlug, id));
  getCanRemoveProject: TeamspacePermissions["getCanRemoveProject"] = computedFn((wSlug, id) =>
    this.getCanEdit(wSlug, id)
  );

  getCanCreateWorkItem: TeamspacePermissions["getCanCreateWorkItem"] = computedFn((wSlug, id) =>
    this.getCanEdit(wSlug, id)
  );

  // All TS members can create pages (teamspace_page:create)
  getCanCreatePage: TeamspacePermissions["getCanCreatePage"] = computedFn(
    (workspaceSlug) => false // TODO: add permission check
    // this.args.can({ resource: "teamspace_page", action: "create", workspaceSlug })
  );

  getViewPermissions: TeamspacePermissions["getViewPermissions"] = computedFn(
    (workspaceSlug: string, teamspaceId: string): TeamspaceViewPermissionsInstance =>
      new TeamspaceViewPermissionsInstance({
        can: this.args.can,
        workspaceSlug,
        teamspaceId,
        getViewConditionContext: (viewId) => this.args.getViewConditionContext(teamspaceId, viewId),
      })
  );

  getCommentPermissions: TeamspacePermissions["getCommentPermissions"] = computedFn(
    (workspaceSlug: string, teamspaceId: string): TeamspaceCommentPermissionsInstance =>
      new TeamspaceCommentPermissionsInstance({
        can: this.args.can,
        workspaceSlug,
        teamspaceId,
        getCommentConditionContext: (commentId) => this.args.getCommentConditionContext(teamspaceId, commentId),
      })
  );
}

// ── Flat permission object types ──────────────────────────────────────────────

export type TTeamspaceListPermissions = {
  canCreate: boolean;
  getCanEdit: (teamspaceId: string) => boolean;
  getCanDelete: (teamspaceId: string) => boolean;
  getCanManage: (teamspaceId: string) => boolean;
  getCanAddProject: (teamspaceId: string) => boolean;
};

export type TTeamspaceItemPermissions = {
  canEdit: boolean;
  canDelete: boolean;
  canManage: boolean;
  canAddProject: boolean;
};

export type TTeamspaceDetailPermissions = {
  canEdit: boolean;
  canDelete: boolean;
  canManage: boolean;
  canEditProperty: (property: TTeamspaceProperty) => boolean;
  canAddMember: boolean;
  canRemoveMember: boolean;
  canAddProject: boolean;
  canRemoveProject: boolean;
  canCreateWorkItem: boolean;
  canCreateView: boolean;
  canCreatePage: boolean;
  comments: {
    canCreate: boolean;
    canEdit: (commentId: string) => boolean;
    canDelete: (commentId: string) => boolean;
    canReact: (commentId: string) => boolean;
  };
};

export type TTeamspaceViewItemPermissions = {
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
};
