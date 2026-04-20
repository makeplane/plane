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
import type { PermissionCheckArgs, TProject } from "@plane/types";
import { canManageProjectRole } from "@plane/utils";
import { ProjectUpdatePermissionsInstance } from "./updates/root";
import type { ProjectUpdatePermissions } from "./updates/root";

export type TProjectProperty = keyof TProject;

export interface ProjectPermissions {
  // Project CRUD
  getCanBrowse: (workspaceSlug: string) => boolean;
  getCanCreate: (workspaceSlug: string) => boolean;
  getCanView: (workspaceSlug: string, projectId: string) => boolean;
  getCanEdit: (workspaceSlug: string, projectId: string) => boolean;
  getCanManage: (workspaceSlug: string, projectId: string) => boolean;
  getCanArchive: (workspaceSlug: string, projectId: string) => boolean;
  getCanRestore: (workspaceSlug: string, projectId: string) => boolean;
  getCanDelete: (workspaceSlug: string, projectId: string) => boolean;
  getCanPublish: (workspaceSlug: string, projectId: string) => boolean;
  getUpdatePermissions: (workspaceSlug: string, projectId: string) => ProjectUpdatePermissions;
  // Drag and property editing
  getCanDragAndDrop: (workspaceSlug: string, projectId: string) => boolean;
  getCanEditProperty: (workspaceSlug: string, projectId: string, property: TProjectProperty) => boolean;
  // Members
  getCanManageMembers: (workspaceSlug: string, projectId: string) => boolean;
  getCanAccessMembersActivity: (workspaceSlug: string, projectId: string) => boolean;
  getCanChangeRole: (workspaceSlug: string, projectId: string, targetRoleSlug: string) => boolean;
  getCanRemoveMember: (workspaceSlug: string, projectId: string) => boolean;
  // Project states
  getCanManageWorkItemStates: (workspaceSlug: string, projectId: string) => boolean;
  // Cycles
  getCanManageCycles: (workspaceSlug: string, projectId: string) => boolean;
  // Modules
  getCanManageModules: (workspaceSlug: string, projectId: string) => boolean;
  // Pages
  getCanManagePages: (workspaceSlug: string, projectId: string) => boolean;
  // Intake
  getCanManageIntake: (workspaceSlug: string, projectId: string) => boolean;
  getCanEditIntake: (workspaceSlug: string, projectId: string) => boolean;
  // Teamspace linking
  getCanLinkTeamspace: (workspaceSlug: string, projectId: string) => boolean;
  getCanRemoveTeamspace: (workspaceSlug: string, projectId: string) => boolean;
  // Template creation during project creation
  getCanCreateTemplate: (workspaceSlug: string) => boolean;
  // Labels
  getCanManageLabels: (workspaceSlug: string, projectId: string) => boolean;
  // Estimates
  getCanManageEstimates: (workspaceSlug: string, projectId: string) => boolean;
  // Automation
  getCanManageAutomations: (workspaceSlug: string, projectId: string) => boolean;
  // Workflow
  getCanManageWorkflows: (workspaceSlug: string, projectId: string) => boolean;
  // project item permissions
  getProjectItemPermissions: (workspaceSlug: string, projectId: string) => Omit<ProjectItemPermissions, "canFavorite">;
}

export type AdditionalProjectPermissionMeta = {
  isArchived: boolean;
};

type ProjectPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  getCurrentUserRoleSlug: (projectId: string) => string | null | undefined;
  getProjectAdditionalMeta: (projectId: string) => AdditionalProjectPermissionMeta;
  getUpdateConditionContext: (projectId: string, updateId: string) => { creator: boolean };
  getUpdateCommentConditionContext: (projectId: string, updateId: string, commentId: string) => { creator: boolean };
};

export class ProjectPermissionsInstance implements ProjectPermissions {
  constructor(private args: ProjectPermissionsArgs) {}

  getCanBrowse: ProjectPermissions["getCanBrowse"] = computedFn((workspaceSlug) =>
    this.args.can({ resource: "project", action: "browse", workspaceSlug })
  );

  getCanCreate: ProjectPermissions["getCanCreate"] = computedFn((workspaceSlug: string) =>
    this.args.can({ resource: "project", action: "create", workspaceSlug })
  );

  getCanView: ProjectPermissions["getCanView"] = computedFn((workspaceSlug, projectId) =>
    this.args.can({
      resource: "project",
      action: "view",
      workspaceSlug,
      resourceMeta: {
        resourceId: projectId,
      },
    })
  );

  getCanEdit: ProjectPermissions["getCanEdit"] = computedFn((workspaceSlug, projectId) =>
    this.args.can({
      resource: "project",
      action: "edit",
      workspaceSlug,
      resourceMeta: {
        resourceId: projectId,
      },
    })
  );

  getCanManage: ProjectPermissions["getCanManage"] = computedFn((workspaceSlug, projectId) =>
    this.args.can({
      resource: "project",
      action: "manage",
      workspaceSlug,
      resourceMeta: {
        resourceId: projectId,
      },
    })
  );

  getCanArchive: ProjectPermissions["getCanArchive"] = computedFn((workspaceSlug, projectId) =>
    this.args.can({
      resource: "project",
      action: "archive",
      workspaceSlug,
      resourceMeta: {
        resourceId: projectId,
      },
    })
  );

  getCanRestore: ProjectPermissions["getCanRestore"] = computedFn((workspaceSlug, projectId) =>
    this.getCanArchive(workspaceSlug, projectId)
  );

  getCanDelete: ProjectPermissions["getCanDelete"] = computedFn((workspaceSlug, projectId) =>
    this.args.can({
      resource: "project",
      action: "delete",
      workspaceSlug,
      resourceMeta: {
        resourceId: projectId,
      },
    })
  );

  getCanPublish: ProjectPermissions["getCanPublish"] = computedFn((workspaceSlug, projectId) =>
    this.args.can({
      resource: "project",
      action: "publish",
      workspaceSlug,
      resourceMeta: {
        resourceId: projectId,
      },
    })
  );

  getUpdatePermissions: ProjectPermissions["getUpdatePermissions"] = computedFn((workspaceSlug, projectId) => {
    const additionalMeta = this.args.getProjectAdditionalMeta(projectId);
    return new ProjectUpdatePermissionsInstance({
      can: this.args.can,
      workspaceSlug,
      projectId,
      isProjectArchived: additionalMeta.isArchived,
      getUpdateConditionContext: (updateId) => this.args.getUpdateConditionContext(projectId, updateId),
      getCommentConditionContext: (updateId, commentId) =>
        this.args.getUpdateCommentConditionContext(projectId, updateId, commentId),
    });
  });

  getCanDragAndDrop: ProjectPermissions["getCanDragAndDrop"] = computedFn((workspaceSlug, projectId) =>
    this.getCanManage(workspaceSlug, projectId)
  );

  getCanEditProperty: ProjectPermissions["getCanEditProperty"] = computedFn((workspaceSlug, projectId, _property) =>
    this.getCanManage(workspaceSlug, projectId)
  );

  getCanManageMembers: ProjectPermissions["getCanManageMembers"] = computedFn((workspaceSlug, projectId) =>
    this.args.can({
      resource: "project_member",
      action: "edit",
      workspaceSlug,
      projectId,
      resourceMeta: {
        resourceId: projectId,
      },
    })
  );

  getCanAccessMembersActivity: ProjectPermissions["getCanAccessMembersActivity"] = computedFn(
    (workspaceSlug, projectId) => this.getCanManageMembers(workspaceSlug, projectId)
  );

  getCanChangeRole: ProjectPermissions["getCanChangeRole"] = computedFn(
    (workspaceSlug, projectId, targetRoleSlug) =>
      this.getCanManageMembers(workspaceSlug, projectId) &&
      canManageProjectRole(this.args.getCurrentUserRoleSlug(projectId), targetRoleSlug)
  );

  getCanRemoveMember: ProjectPermissions["getCanRemoveMember"] = computedFn((workspaceSlug, projectId) =>
    this.args.can({
      resource: "project_member",
      action: "remove",
      workspaceSlug,
      projectId,
      resourceMeta: {
        resourceId: projectId,
      },
    })
  );

  getCanManageWorkItemStates: ProjectPermissions["getCanManageWorkItemStates"] = computedFn(
    (workspaceSlug, projectId) => this.getCanManage(workspaceSlug, projectId)
  );

  getCanManageCycles: ProjectPermissions["getCanManageCycles"] = computedFn((workspaceSlug, projectId) =>
    this.getCanManage(workspaceSlug, projectId)
  );

  getCanManageModules: ProjectPermissions["getCanManageModules"] = computedFn((workspaceSlug, projectId) =>
    this.getCanManage(workspaceSlug, projectId)
  );

  getCanManageEstimates: ProjectPermissions["getCanManageEstimates"] = computedFn((workspaceSlug, projectId) =>
    this.getCanManage(workspaceSlug, projectId)
  );

  getCanManagePages: ProjectPermissions["getCanManagePages"] = computedFn((workspaceSlug, projectId) =>
    this.getCanManage(workspaceSlug, projectId)
  );

  getCanManageIntake: ProjectPermissions["getCanManageIntake"] = computedFn((workspaceSlug, projectId) =>
    this.getCanManage(workspaceSlug, projectId)
  );

  getCanEditIntake: ProjectPermissions["getCanEditIntake"] = computedFn((workspaceSlug, projectId) =>
    this.getCanManageIntake(workspaceSlug, projectId)
  );

  getCanLinkTeamspace: ProjectPermissions["getCanLinkTeamspace"] = computedFn(
    (workspaceSlug: string, projectId: string) =>
      this.getCanCreate(workspaceSlug) && this.getCanManage(workspaceSlug, projectId)
  );

  getCanRemoveTeamspace: ProjectPermissions["getCanRemoveTeamspace"] = computedFn((workspaceSlug, projectId) =>
    this.getCanManage(workspaceSlug, projectId)
  );

  getCanCreateTemplate: ProjectPermissions["getCanCreateTemplate"] = computedFn((workspaceSlug) =>
    this.getCanCreate(workspaceSlug)
  );

  getCanManageLabels: ProjectPermissions["getCanManageLabels"] = computedFn((workspaceSlug, projectId) =>
    this.getCanManage(workspaceSlug, projectId)
  );

  getCanManageAutomations: ProjectPermissions["getCanManageAutomations"] = computedFn((workspaceSlug, projectId) =>
    this.getCanManage(workspaceSlug, projectId)
  );

  getCanManageWorkflows: ProjectPermissions["getCanManageWorkflows"] = computedFn((workspaceSlug, projectId) =>
    this.getCanManage(workspaceSlug, projectId)
  );

  getProjectItemPermissions: ProjectPermissions["getProjectItemPermissions"] = computedFn(
    (workspaceSlug, projectId) => {
      const additionalMeta = this.args.getProjectAdditionalMeta(projectId);
      return {
        canEdit: this.getCanEdit(workspaceSlug, projectId),
        canManage: this.getCanManage(workspaceSlug, projectId),
        canArchive: !additionalMeta.isArchived && this.getCanArchive(workspaceSlug, projectId),
        canRestore: additionalMeta.isArchived && this.getCanRestore(workspaceSlug, projectId),
        canDelete: this.getCanDelete(workspaceSlug, projectId),
        canDragAndDrop: this.getCanDragAndDrop(workspaceSlug, projectId),
        canEditProperty: (property) => this.getCanEditProperty(workspaceSlug, projectId, property),
        canManageMembers: this.getCanManageMembers(workspaceSlug, projectId),
        canAccessMembersActivity: this.getCanAccessMembersActivity(workspaceSlug, projectId),
        canChangeRole: (targetRoleSlug: string) => this.getCanChangeRole(workspaceSlug, projectId, targetRoleSlug),
        canRemoveMember: this.getCanRemoveMember(workspaceSlug, projectId),
        canLinkTeamspace: this.getCanLinkTeamspace(workspaceSlug, projectId),
        canRemoveTeamspace: this.getCanRemoveTeamspace(workspaceSlug, projectId),
        canEditIntake: this.getCanEditIntake(workspaceSlug, projectId),
        canManageIntake: this.getCanManageIntake(workspaceSlug, projectId),
      };
    }
  );
}

// Passed to individual project cards/items
export type ProjectItemPermissions = {
  canEdit: boolean;
  canManage: boolean;
  canArchive: boolean;
  canRestore: boolean;
  canDelete: boolean;
  canFavorite: boolean;
  canDragAndDrop: boolean;
  canManageMembers: boolean;
  canAccessMembersActivity: boolean;
  canChangeRole: (targetRoleSlug: string) => boolean;
  canRemoveMember: boolean;
  canLinkTeamspace: boolean;
  canRemoveTeamspace: boolean;
  canEditIntake: boolean;
  canManageIntake: boolean;
  canEditProperty: (property: TProjectProperty) => boolean;
};

// Passed to layout-level (HOC and roots)
export type ProjectLayoutPermissions = {
  canCreateProject: boolean;
};
