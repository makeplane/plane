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
import type { CollectionActionsForResource, PermissionCheckArgs, TIssue } from "@plane/types";
// local imports
import { WorkItemCommentPermissionsInstance } from "./comment";

export type TWorkItemProperty = keyof TIssue;

export interface WorkItemPermissions {
  // helpers
  getCanView: (workspaceSlug: string, projectId: string) => boolean;
  getCanCreate: (workspaceSlug: string, projectId: string) => boolean;
  getCanEdit: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanDelete: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanSubscribe: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanReact: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanArchive: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanRestore: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanDuplicate: (workspaceSlug: string, projectId: string) => boolean;
  getCanConvertToEpic: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanPerformBulkOps: (workspaceSlug: string, projectId: string) => boolean;
  getCanEditProperty: (
    workspaceSlug: string,
    projectId: string,
    workItemId: string,
    property: TWorkItemProperty
  ) => boolean;
  getCanDragAndDrop: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanSwitchWorkItemType: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanRestoreDescriptionVersion: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanAddSubWorkItems: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanAddDependencies: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanAddRelations: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanAddLinks: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanAddAttachments: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanAddPages: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanAddCustomerRequests: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCommentPermissions: (
    workspaceSlug: string,
    projectId: string,
    workItemId: string
  ) => WorkItemCommentPermissionsInstance;
  getCanAddWorklog: (workspaceSlug: string, projectId: string, workItemId: string) => boolean;
  getCanExport: (workspaceSlug: string, projectId: string) => boolean;
  getProjectIdsWithWorkItemPermission: (
    workspaceSlug: string,
    projectIds: string[],
    action: CollectionActionsForResource<"workitem">
  ) => Set<string>;
}

export type AdditionalWorkItemPermissionMeta = {
  isArchived: boolean;
  isIntakeWorkItem: boolean;
};

type WorkItemPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  getWorkItemConditionContext: (workItemId: string) => { creator: boolean };
  getWorkItemCommentConditionContext: (workItemId: string, commentId: string) => { creator: boolean };
  getAdditionalWorkItemPermissionMeta: (workItemId: string) => AdditionalWorkItemPermissionMeta;
};

export class WorkItemPermissionsInstance implements WorkItemPermissions {
  constructor(private args: WorkItemPermissionsArgs) {}

  getCanView: WorkItemPermissions["getCanView"] = computedFn((workspaceSlug, projectId) => {
    return this.args.can({
      resource: "workitem",
      action: "view",
      projectId,
      workspaceSlug,
      resourceMeta: {
        conditionContext: {
          creator: true,
        },
      },
    });
  });

  getCanCreate: WorkItemPermissions["getCanCreate"] = computedFn((workspaceSlug, projectId) => {
    return this.args.can({
      resource: "workitem",
      action: "create",
      projectId,
      workspaceSlug,
    });
  });

  getCanEdit: WorkItemPermissions["getCanEdit"] = computedFn((workspaceSlug, projectId, workItemId) => {
    const additionalMeta = this.args.getAdditionalWorkItemPermissionMeta(workItemId);
    return (
      !additionalMeta.isArchived &&
      this.args.can({
        resource: "workitem",
        action: "edit",
        projectId,
        workspaceSlug,
        resourceMeta: {
          resourceId: workItemId,
          conditionContext: this.args.getWorkItemConditionContext(workItemId),
        },
      })
    );
  });

  getCanDelete: WorkItemPermissions["getCanDelete"] = computedFn((workspaceSlug, projectId, workItemId) => {
    return this.args.can({
      resource: "workitem",
      action: "delete",
      projectId,
      workspaceSlug,
      resourceMeta: {
        resourceId: workItemId,
        conditionContext: this.args.getWorkItemConditionContext(workItemId),
      },
    });
  });

  getCanSubscribe: WorkItemPermissions["getCanSubscribe"] = computedFn((workspaceSlug, projectId, workItemId) => {
    return this.getCanEdit(workspaceSlug, projectId, workItemId);
  });

  getCanReact: WorkItemPermissions["getCanReact"] = computedFn((workspaceSlug, projectId, workItemId) => {
    return this.args.can({
      resource: "workitem",
      action: "react",
      projectId,
      workspaceSlug,
      resourceMeta: {
        resourceId: workItemId,
      },
    });
  });

  getCanArchive: WorkItemPermissions["getCanArchive"] = computedFn((workspaceSlug, projectId, workItemId) => {
    const additionalMeta = this.args.getAdditionalWorkItemPermissionMeta(workItemId);
    return (
      !additionalMeta.isArchived &&
      this.args.can({
        resource: "workitem",
        action: "archive",
        projectId,
        workspaceSlug,
        resourceMeta: {
          resourceId: workItemId,
        },
      })
    );
  });

  getCanRestore: WorkItemPermissions["getCanRestore"] = computedFn((workspaceSlug, projectId, workItemId) => {
    const additionalMeta = this.args.getAdditionalWorkItemPermissionMeta(workItemId);
    return (
      additionalMeta.isArchived &&
      this.args.can({
        resource: "workitem",
        action: "archive",
        projectId,
        workspaceSlug,
        resourceMeta: {
          resourceId: workItemId,
        },
      })
    );
  });

  getCanDuplicate: WorkItemPermissions["getCanDuplicate"] = computedFn((workspaceSlug, projectId) => {
    return this.getCanCreate(workspaceSlug, projectId);
  });

  getCanSwitchWorkItemType: WorkItemPermissions["getCanSwitchWorkItemType"] = computedFn(
    (workspaceSlug, projectId, workItemId) => {
      const additionalMeta = this.args.getAdditionalWorkItemPermissionMeta(workItemId);
      return !additionalMeta.isArchived && this.getCanEdit(workspaceSlug, projectId, workItemId);
    }
  );

  getCanConvertToEpic: WorkItemPermissions["getCanConvertToEpic"] = computedFn(
    (workspaceSlug, projectId, workItemId) => {
      return this.getCanEdit(workspaceSlug, projectId, workItemId);
    }
  );

  getCanPerformBulkOps: WorkItemPermissions["getCanPerformBulkOps"] = computedFn((workspaceSlug, projectId) => {
    return this.args.can({
      resource: "workitem",
      action: "bulk_edit",
      projectId,
      workspaceSlug,
      resourceMeta: {
        resourceId: projectId,
      },
    });
  });

  getCanEditProperty: WorkItemPermissions["getCanEditProperty"] = computedFn((workspaceSlug, projectId, workItemId) => {
    return this.getCanEdit(workspaceSlug, projectId, workItemId);
  });

  getCanDragAndDrop: WorkItemPermissions["getCanDragAndDrop"] = computedFn((workspaceSlug, projectId, workItemId) => {
    return this.getCanEdit(workspaceSlug, projectId, workItemId);
  });

  getCanRestoreDescriptionVersion: WorkItemPermissions["getCanRestoreDescriptionVersion"] = computedFn(
    (workspaceSlug, projectId, workItemId) => {
      return this.getCanEdit(workspaceSlug, projectId, workItemId);
    }
  );

  getCanAddSubWorkItems: WorkItemPermissions["getCanAddSubWorkItems"] = computedFn(
    (workspaceSlug, projectId, workItemId) => {
      return this.getCanEdit(workspaceSlug, projectId, workItemId);
    }
  );

  getCanAddDependencies: WorkItemPermissions["getCanAddDependencies"] = computedFn(
    (workspaceSlug, projectId, workItemId) => {
      return this.getCanEdit(workspaceSlug, projectId, workItemId);
    }
  );

  getCanAddRelations: WorkItemPermissions["getCanAddRelations"] = computedFn((workspaceSlug, projectId, workItemId) => {
    return this.getCanEdit(workspaceSlug, projectId, workItemId);
  });

  getCanAddLinks: WorkItemPermissions["getCanAddLinks"] = computedFn((workspaceSlug, projectId, workItemId) => {
    return this.args.can({
      resource: "workitem_link",
      action: "create",
      projectId,
      workspaceSlug,
      resourceMeta: {
        resourceId: workItemId,
      },
    });
  });

  getCanAddAttachments: WorkItemPermissions["getCanAddAttachments"] = computedFn(
    (workspaceSlug, projectId, workItemId) => {
      return this.getCanEdit(workspaceSlug, projectId, workItemId);
    }
  );

  getCanAddPages: WorkItemPermissions["getCanAddPages"] = computedFn((workspaceSlug, projectId, workItemId) => {
    return this.getCanEdit(workspaceSlug, projectId, workItemId);
  });

  getCanAddCustomerRequests: WorkItemPermissions["getCanAddCustomerRequests"] = computedFn(
    (workspaceSlug, projectId, workItemId) => {
      return this.getCanEdit(workspaceSlug, projectId, workItemId);
    }
  );

  getCommentPermissions: WorkItemPermissions["getCommentPermissions"] = computedFn(
    (workspaceSlug, projectId, workItemId) => {
      const additionalMeta = this.args.getAdditionalWorkItemPermissionMeta(workItemId);
      return new WorkItemCommentPermissionsInstance({
        can: this.args.can,
        workspaceSlug,
        projectId,
        isWorkItemArchived: additionalMeta.isArchived,
        getCommentConditionContext: (commentId) => this.args.getWorkItemCommentConditionContext(workItemId, commentId),
      });
    }
  );

  getCanAddWorklog: WorkItemPermissions["getCanAddWorklog"] = computedFn((workspaceSlug, projectId, workItemId) => {
    const additionalMeta = this.args.getAdditionalWorkItemPermissionMeta(workItemId);
    return (
      !additionalMeta.isIntakeWorkItem && this.getCommentPermissions(workspaceSlug, projectId, workItemId).canCreate
    );
  });

  getCanExport: WorkItemPermissions["getCanExport"] = computedFn((workspaceSlug, projectId) => {
    return this.args.can({
      resource: "workitem",
      action: "export",
      projectId,
      workspaceSlug,
    });
  });

  getProjectIdsWithWorkItemPermission: WorkItemPermissions["getProjectIdsWithWorkItemPermission"] = computedFn(
    (workspaceSlug, projectIds, action) =>
      new Set(
        projectIds.filter((projectId) => this.args.can({ resource: "workitem", action, projectId, workspaceSlug }))
      )
  );
}
