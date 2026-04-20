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
import { InitiativeCommentPermissionsInstance } from "./comment";
import { InitiativeLabelPermissionsInstance } from "./label";
import type { TInitiative } from "@/types/initiative/initiative";
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";

// All editable fields on an initiative. All map to initiative:edit for now,
// but having granular method gives flexibility for future differentiation.
export type TInitiativeProperty = keyof TInitiative;

export interface InitiativePermissions {
  // ── Initiative CRUD ──────────────────────────────────────────────────────────
  getCanView: (workspaceSlug: string) => boolean;
  getCanCreate: (workspaceSlug: string) => boolean;
  getCanEdit: (workspaceSlug: string, initiativeId: string) => boolean;
  getCanDelete: (workspaceSlug: string, initiativeId: string) => boolean;

  // ── Drag-and-drop ────────────────────────────────────────────────────────────
  getCanDragAndDrop: (workspaceSlug: string, initiativeId: string) => boolean;

  // ── Property-level editing ───────────────────────────────────────────────────
  // Delegates to getCanEdit for now; named separately for future granularity.
  getCanEditProperty: (workspaceSlug: string, initiativeId: string, property: TInitiativeProperty) => boolean;

  // ── Reactions ────────────────────────────────────────────────────────────────
  getCanReact: (workspaceSlug: string, initiativeId: string) => boolean;

  // ── Links (no dedicated backend resource; maps to initiative:edit) ────────────
  getCanAddLink: (workspaceSlug: string, initiativeId: string) => boolean;
  getCanEditLink: (workspaceSlug: string, initiativeId: string) => boolean;
  getCanDeleteLink: (workspaceSlug: string, initiativeId: string) => boolean;

  // ── Attachments (initiative_attachment resource) ──────────────────────────────
  getCanAddAttachment: (workspaceSlug: string, initiativeId: string) => boolean;
  getCanDeleteAttachment: (workspaceSlug: string, initiativeId: string, attachmentId: string) => boolean;

  // ── Scope ──────────────────────────────────────────────────────────
  getCanAddScope: (workspaceSlug: string, initiativeId: string) => boolean;

  // ── Scope: Projects ──────────────────────────────────────────────────────────
  getCanAddProject: (workspaceSlug: string, initiativeId: string) => boolean;
  getCanRemoveProject: (workspaceSlug: string, initiativeId: string) => boolean;
  getCanEditProject: (workspaceSlug: string, initiativeId: string, projectId: string) => boolean;

  // ── Scope: Epics ─────────────────────────────────────────────────────────────
  getCanAddEpic: (workspaceSlug: string, initiativeId: string) => boolean;
  getCanRemoveEpic: (workspaceSlug: string, initiativeId: string) => boolean;
  getCanEditEpic: (workspaceSlug: string, initiativeId: string, epicId: string) => boolean;
  getCanEditEpicProperty: (
    workspaceSlug: string,
    initiativeId: string,
    epicId: string,
    property: TWorkItemProperty
  ) => boolean;

  // ── Labels (initiative_label resource) ───────────────────────────────────────
  // Returns a per-workspace label permission instance (not per-initiative).
  getLabelPermissions: (workspaceSlug: string) => InitiativeLabelPermissionsInstance;

  // ── Comments (initiative_comment resource) ────────────────────────────────────
  getCommentPermissions: (workspaceSlug: string, initiativeId: string) => InitiativeCommentPermissionsInstance;
}

type InitiativePermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  getAttachmentConditionContext: (initiativeId: string, attachmentId: string) => { creator: boolean };
  getCommentConditionContext: (initiativeId: string, commentId: string) => { creator: boolean };
};

export class InitiativePermissionsInstance implements InitiativePermissions {
  constructor(private args: InitiativePermissionsArgs) {}

  // CRUD
  getCanView: InitiativePermissions["getCanView"] = computedFn((workspaceSlug) =>
    this.args.can({ resource: "initiative", action: "view", workspaceSlug })
  );

  getCanCreate: InitiativePermissions["getCanCreate"] = computedFn((workspaceSlug) =>
    this.args.can({ resource: "initiative", action: "create", workspaceSlug })
  );

  getCanEdit: InitiativePermissions["getCanEdit"] = computedFn((workspaceSlug, initiativeId) =>
    this.args.can({
      resource: "initiative",
      action: "edit",
      workspaceSlug,
      resourceMeta: {
        resourceId: initiativeId,
      },
    })
  );

  getCanDelete: InitiativePermissions["getCanDelete"] = computedFn((workspaceSlug, initiativeId) =>
    this.args.can({
      resource: "initiative",
      action: "delete",
      workspaceSlug,
      resourceMeta: {
        resourceId: initiativeId,
      },
    })
  );

  // Drag-and-drop delegates to edit permission
  getCanDragAndDrop: InitiativePermissions["getCanDragAndDrop"] = computedFn((workspaceSlug, initiativeId) =>
    this.getCanEdit(workspaceSlug, initiativeId)
  );

  // Property-level editing delegates to edit; named separately for future granularity
  getCanEditProperty: InitiativePermissions["getCanEditProperty"] = computedFn(
    (workspaceSlug, initiativeId, _property) => this.getCanEdit(workspaceSlug, initiativeId)
  );

  // React to initiative
  getCanReact: InitiativePermissions["getCanReact"] = computedFn((workspaceSlug, initiativeId) =>
    this.args.can({
      resource: "initiative",
      action: "react",
      workspaceSlug,
      resourceMeta: {
        resourceId: initiativeId,
      },
    })
  );

  // Links — no dedicated backend resource; all use initiative:edit
  getCanAddLink: InitiativePermissions["getCanAddLink"] = computedFn((workspaceSlug, initiativeId) =>
    this.getCanEdit(workspaceSlug, initiativeId)
  );

  getCanEditLink: InitiativePermissions["getCanEditLink"] = computedFn((workspaceSlug, initiativeId) =>
    this.getCanEdit(workspaceSlug, initiativeId)
  );

  getCanDeleteLink: InitiativePermissions["getCanDeleteLink"] = computedFn((workspaceSlug, initiativeId) =>
    this.getCanEdit(workspaceSlug, initiativeId)
  );

  // Attachments — use initiative_attachment resource
  getCanAddAttachment: InitiativePermissions["getCanAddAttachment"] = computedFn((workspaceSlug, _initiativeId) =>
    // Attachment create is at collection level; no resourceMeta
    this.args.can({
      resource: "initiative_attachment",
      action: "create",
      workspaceSlug,
    })
  );

  getCanDeleteAttachment: InitiativePermissions["getCanDeleteAttachment"] = computedFn(
    (workspaceSlug, initiativeId, attachmentId) =>
      this.args.can({
        resource: "initiative_attachment",
        action: "delete",
        workspaceSlug,
        resourceMeta: {
          resourceId: attachmentId,
          conditionContext: this.args.getAttachmentConditionContext(initiativeId, attachmentId),
        },
      })
  );

  // Scope
  getCanAddScope: InitiativePermissions["getCanAddScope"] = computedFn((workspaceSlug, initiativeId) =>
    this.getCanEdit(workspaceSlug, initiativeId)
  );

  // Scope: projects — use initiative:edit
  getCanAddProject: InitiativePermissions["getCanAddProject"] = computedFn((workspaceSlug, initiativeId) =>
    this.getCanEdit(workspaceSlug, initiativeId)
  );

  getCanRemoveProject: InitiativePermissions["getCanRemoveProject"] = computedFn((workspaceSlug, initiativeId) =>
    this.getCanEdit(workspaceSlug, initiativeId)
  );

  getCanEditProject: InitiativePermissions["getCanEditProject"] = computedFn(
    (workspaceSlug, initiativeId, _projectId) => this.getCanEdit(workspaceSlug, initiativeId)
  );

  // Scope: epics — use initiative:edit
  getCanAddEpic: InitiativePermissions["getCanAddEpic"] = computedFn((workspaceSlug, initiativeId) =>
    this.getCanEdit(workspaceSlug, initiativeId)
  );

  getCanRemoveEpic: InitiativePermissions["getCanRemoveEpic"] = computedFn((workspaceSlug, initiativeId) =>
    this.getCanEdit(workspaceSlug, initiativeId)
  );

  getCanEditEpic: InitiativePermissions["getCanEditEpic"] = computedFn((workspaceSlug, initiativeId, _epicId) =>
    this.getCanEdit(workspaceSlug, initiativeId)
  );

  getCanEditEpicProperty: InitiativePermissions["getCanEditEpicProperty"] = computedFn(
    (workspaceSlug, initiativeId, epicId) => this.getCanEditEpic(workspaceSlug, initiativeId, epicId)
  );

  // Labels — return a per-workspace InitiativeLabelPermissionsInstance
  // Scoped to workspace only (labels are not per-initiative).
  getLabelPermissions: InitiativePermissions["getLabelPermissions"] = computedFn(
    (workspaceSlug: string): InitiativeLabelPermissionsInstance =>
      new InitiativeLabelPermissionsInstance({
        can: this.args.can,
        workspaceSlug,
      })
  );

  // Comments — return a new InitiativeCommentPermissionsInstance per (workspaceSlug, initiativeId) pair
  getCommentPermissions: InitiativePermissions["getCommentPermissions"] = computedFn(
    (workspaceSlug: string, initiativeId: string): InitiativeCommentPermissionsInstance =>
      new InitiativeCommentPermissionsInstance({
        can: this.args.can,
        workspaceSlug,
        getCommentConditionContext: (commentId) => this.args.getCommentConditionContext(initiativeId, commentId),
      })
  );
}

// Passed to individual item components (initiative-block, initiative-kanban-card):
export type TInitiativeItemPermissions = {
  canEditProperty: (property: TInitiativeProperty) => boolean;
  canDragAndDrop: boolean;
  quickActions: {
    canEdit: boolean;
    canDelete: boolean;
  };
};

// Passed to the full detail/peek-overview view:
export type TInitiativeDetailPermissions = {
  // Initiative
  canEdit: boolean;
  canDelete: boolean;
  canReact: boolean;
  canEditProperty: (property: TInitiativeProperty) => boolean;

  // Links
  canAddLink: boolean;
  canEditLink: boolean;
  canDeleteLink: boolean;

  // Attachments
  canAddAttachment: boolean;
  canDeleteAttachment: (attachmentId: string) => boolean;

  // Scope
  canAddScope: boolean;
  canAddProject: boolean;
  canRemoveProject: boolean;
  canAddEpic: boolean;
  canRemoveEpic: boolean;

  // Labels — plain object with per-label callbacks (NOT the instance)
  labels: {
    canCreate: boolean;
    canEdit: (labelId: string) => boolean;
    canDelete: (labelId: string) => boolean;
    canReorder: (labelId: string) => boolean;
  };

  // Comments — plain object with per-comment callbacks (NOT the instance)
  comments: {
    canCreate: boolean;
    canEdit: (commentId: string) => boolean;
    canDelete: (commentId: string) => boolean;
    canReact: (commentId: string) => boolean;
  };
};
