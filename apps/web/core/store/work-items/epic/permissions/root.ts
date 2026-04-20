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
// plane imports
import type { CollectionActionsForResource, PermissionCheckArgs } from "@plane/types";
// store
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";
// local imports
import { EpicCommentPermissionsInstance } from "./comment";
import { EpicUpdatePermissionsInstance } from "./updates/root";

export interface EpicPermissions {
  getCanView: (workspaceSlug: string, projectId: string) => boolean;
  getCanCreate: (workspaceSlug: string, projectId: string) => boolean;
  getCanDuplicate: (workspaceSlug: string, projectId: string) => boolean;
  getCanEdit: (workspaceSlug: string, projectId: string, epicId: string) => boolean;
  getCanDelete: (workspaceSlug: string, projectId: string, epicId: string) => boolean;
  getCanSubscribe: (workspaceSlug: string, projectId: string, epicId: string) => boolean;
  getCanArchive: (workspaceSlug: string, projectId: string, epicId: string) => boolean;
  getCanRestore: (workspaceSlug: string, projectId: string, epicId: string) => boolean;
  getCanExport: (workspaceSlug: string, projectId: string) => boolean;
  getCanConvertToWorkItem: (workspaceSlug: string, projectId: string, epicId: string) => boolean;
  getCanReact: (workspaceSlug: string, projectId: string, epicId: string) => boolean;
  getCanEditProperty: (
    workspaceSlug: string,
    projectId: string,
    epicId: string,
    property: TWorkItemProperty
  ) => boolean;
  getCanDragAndDrop: (workspaceSlug: string, projectId: string, epicId: string) => boolean;
  getCanSwitchWorkItemType: (workspaceSlug: string, projectId: string, epicId: string) => boolean;
  getCanRestoreDescriptionVersion: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanAddWorkItems: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanAddDependencies: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanAddRelations: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanAddLinks: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanAddAttachments: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanAddPages: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanAddCustomerRequests: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCommentPermissions: (workspaceSlug: string, projectId: string, epicId: string) => EpicCommentPermissionsInstance;
  getUpdatePermissions: (workspaceSlug: string, projectId: string, epicId: string) => EpicUpdatePermissionsInstance;
  getProjectIdsWithEpicPermission: (
    workspaceSlug: string,
    projectIds: string[],
    action: CollectionActionsForResource<"epic">
  ) => Set<string>;
}

export type AdditionalEpicPermissionMeta = {
  isArchived: boolean;
};

type EpicPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  getEpicConditionContext: (epicId: string) => { creator: boolean };
  getEpicCommentConditionContext: (epicId: string, commentId: string) => { creator: boolean };
  getEpicUpdateConditionContext: (epicId: string, updateId: string) => { creator: boolean };
  getEpicUpdateCommentConditionContext: (epicId: string, updateId: string, commentId: string) => { creator: boolean };
  getEpicAdditionalMeta: (epicId: string) => AdditionalEpicPermissionMeta;
};

export class EpicPermissionsInstance implements EpicPermissions {
  constructor(private args: EpicPermissionsArgs) {}

  getCanView: EpicPermissions["getCanView"] = computedFn((workspaceSlug, projectId) => {
    return this.args.can({
      resource: "epic",
      action: "view",
      projectId,
      workspaceSlug,
    });
  });

  getCanCreate: EpicPermissions["getCanCreate"] = computedFn((workspaceSlug, projectId) => {
    return this.args.can({
      resource: "epic",
      action: "create",
      projectId,
      workspaceSlug,
    });
  });

  getCanDuplicate: EpicPermissions["getCanDuplicate"] = computedFn((workspaceSlug, projectId) => {
    return this.getCanCreate(workspaceSlug, projectId);
  });

  getCanEdit: EpicPermissions["getCanEdit"] = computedFn((workspaceSlug, projectId, epicId) => {
    const additionalMeta = this.args.getEpicAdditionalMeta(epicId);
    return (
      !additionalMeta.isArchived &&
      this.args.can({
        resource: "epic",
        action: "edit",
        projectId,
        workspaceSlug,
        resourceMeta: {
          resourceId: epicId,
        },
      })
    );
  });

  getCanDelete: EpicPermissions["getCanDelete"] = computedFn((workspaceSlug, projectId, epicId) => {
    return this.args.can({
      resource: "epic",
      action: "delete",
      projectId,
      workspaceSlug,
      resourceMeta: {
        resourceId: epicId,
        conditionContext: this.args.getEpicConditionContext(epicId),
      },
    });
  });

  getCanSubscribe: EpicPermissions["getCanSubscribe"] = computedFn((workspaceSlug, projectId, epicId) => {
    return this.getCanEdit(workspaceSlug, projectId, epicId);
  });

  getCanArchive: EpicPermissions["getCanArchive"] = computedFn((workspaceSlug, projectId, epicId) => {
    const additionalMeta = this.args.getEpicAdditionalMeta(epicId);
    return (
      !additionalMeta.isArchived &&
      this.args.can({
        resource: "epic",
        action: "archive",
        projectId,
        workspaceSlug,
        resourceMeta: {
          resourceId: epicId,
        },
      })
    );
  });

  getCanRestore: EpicPermissions["getCanRestore"] = computedFn((workspaceSlug, projectId, epicId) => {
    const additionalMeta = this.args.getEpicAdditionalMeta(epicId);
    return (
      additionalMeta.isArchived &&
      this.args.can({
        resource: "epic",
        action: "archive",
        projectId,
        workspaceSlug,
        resourceMeta: {
          resourceId: epicId,
        },
      })
    );
  });

  getCanExport: EpicPermissions["getCanExport"] = computedFn((workspaceSlug, projectId) => {
    return this.args.can({
      resource: "epic",
      action: "export",
      projectId,
      workspaceSlug,
    });
  });

  getCanConvertToWorkItem: EpicPermissions["getCanConvertToWorkItem"] = computedFn(
    (workspaceSlug, projectId, epicId) => {
      return this.getCanEdit(workspaceSlug, projectId, epicId);
    }
  );

  getCanReact: EpicPermissions["getCanReact"] = computedFn((workspaceSlug, projectId, epicId) => {
    return this.args.can({
      resource: "epic",
      action: "react",
      projectId,
      workspaceSlug,
      resourceMeta: {
        resourceId: epicId,
      },
    });
  });

  getCanEditProperty: EpicPermissions["getCanEditProperty"] = computedFn((workspaceSlug, projectId, epicId) => {
    return this.getCanEdit(workspaceSlug, projectId, epicId);
  });

  getCanDragAndDrop: EpicPermissions["getCanDragAndDrop"] = computedFn((workspaceSlug, projectId, epicId) => {
    return this.getCanEdit(workspaceSlug, projectId, epicId);
  });

  getCanSwitchWorkItemType: EpicPermissions["getCanSwitchWorkItemType"] = computedFn(() => {
    return false;
  });

  getCanRestoreDescriptionVersion: EpicPermissions["getCanRestoreDescriptionVersion"] = computedFn(
    (workspaceSlug, projectId, epicId) => {
      return this.getCanEdit(workspaceSlug, projectId, epicId);
    }
  );

  getCanAddWorkItems: EpicPermissions["getCanAddWorkItems"] = computedFn((workspaceSlug, projectId, epicId) => {
    return this.getCanEdit(workspaceSlug, projectId, epicId);
  });

  getCanAddDependencies: EpicPermissions["getCanAddDependencies"] = computedFn((workspaceSlug, projectId, epicId) => {
    return this.getCanEdit(workspaceSlug, projectId, epicId);
  });

  getCanAddRelations: EpicPermissions["getCanAddRelations"] = computedFn((workspaceSlug, projectId, epicId) => {
    return this.getCanEdit(workspaceSlug, projectId, epicId);
  });

  getCanAddLinks: EpicPermissions["getCanAddLinks"] = computedFn((workspaceSlug, projectId, epicId) => {
    return this.getCanEdit(workspaceSlug, projectId, epicId);
  });

  getCanAddAttachments: EpicPermissions["getCanAddAttachments"] = computedFn((workspaceSlug, projectId, epicId) => {
    return this.getCanEdit(workspaceSlug, projectId, epicId);
  });

  getCanAddPages: EpicPermissions["getCanAddPages"] = computedFn((workspaceSlug, projectId, epicId) => {
    return this.getCanEdit(workspaceSlug, projectId, epicId);
  });

  getCanAddCustomerRequests: EpicPermissions["getCanAddCustomerRequests"] = computedFn(
    (workspaceSlug, projectId, epicId) => {
      return this.getCanEdit(workspaceSlug, projectId, epicId);
    }
  );

  getCommentPermissions: EpicPermissions["getCommentPermissions"] = computedFn((workspaceSlug, projectId, epicId) => {
    const additionalMeta = this.args.getEpicAdditionalMeta(epicId);
    return new EpicCommentPermissionsInstance({
      can: this.args.can,
      workspaceSlug,
      projectId,
      isWorkItemArchived: additionalMeta.isArchived,
      getCommentConditionContext: (commentId) => this.args.getEpicCommentConditionContext(epicId, commentId),
    });
  });

  getUpdatePermissions: EpicPermissions["getUpdatePermissions"] = computedFn((workspaceSlug, projectId, epicId) => {
    const additionalMeta = this.args.getEpicAdditionalMeta(epicId);
    return new EpicUpdatePermissionsInstance({
      can: this.args.can,
      workspaceSlug,
      projectId,
      isEpicArchived: additionalMeta.isArchived,
      getUpdateConditionContext: (updateId) => this.args.getEpicUpdateConditionContext(epicId, updateId),
      getUpdateCommentConditionContext: (updateId, commentId) =>
        this.args.getEpicUpdateCommentConditionContext(epicId, updateId, commentId),
    });
  });

  getProjectIdsWithEpicPermission: EpicPermissions["getProjectIdsWithEpicPermission"] = computedFn(
    (workspaceSlug, projectIds, action) =>
      new Set(projectIds.filter((projectId) => this.args.can({ resource: "epic", action, projectId, workspaceSlug })))
  );
}
