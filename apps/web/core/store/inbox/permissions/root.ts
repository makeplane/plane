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
import type { PermissionCheckArgs, TIssue } from "@plane/types";
import { WorkItemCommentPermissionsInstance } from "./comment";

export type TIntakeWorkItemProperty = keyof TIssue;

export interface IntakeWorkItemPermissions {
  // helpers
  getCanView: (workspaceSlug: string, projectId: string) => boolean;
  getCanCreate: (workspaceSlug: string, projectId: string) => boolean;
  getCanEdit: (workspaceSlug: string, projectId: string, intakeWorkItemId: string) => boolean;
  getCanManage: (workspaceSlug: string, projectId: string, intakeWorkItemId: string) => boolean;
  getCanDelete: (workspaceSlug: string, projectId: string, intakeWorkItemId: string) => boolean;
  getCanReact: (workspaceSlug: string, projectId: string, intakeWorkItemId: string) => boolean;
  getCanEditProperty: (
    workspaceSlug: string,
    projectId: string,
    intakeWorkItemId: string,
    property: TIntakeWorkItemProperty
  ) => boolean;
  getCanAccept: (workspaceSlug: string, projectId: string, intakeWorkItemId: string) => boolean;
  getCanDecline: (workspaceSlug: string, projectId: string, intakeWorkItemId: string) => boolean;
  getCanMarkAsDuplicate: (workspaceSlug: string, projectId: string, intakeWorkItemId: string) => boolean;
  getCanRestoreDescriptionVersion: (workspaceSlug: string, projectId: string, intakeWorkItemId: string) => boolean;
  getCanAddAttachments: (workspaceSlug: string, projectId: string, intakeWorkItemId: string) => boolean;
  getCommentPermissions: (
    workspaceSlug: string,
    projectId: string,
    intakeWorkItemId: string
  ) => WorkItemCommentPermissionsInstance;
  getCanAddWorklog: (workspaceSlug: string, projectId: string, intakeWorkItemId: string) => boolean;
  getCanExport: (workspaceSlug: string, projectId: string) => boolean;
}

export type AdditionalIntakeWorkItemPermissionMeta = {
  isInDisabledStatus: boolean;
  isInActionableStatus: boolean;
};

type IntakeWorkItemPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  getIntakeConditionContext: (intakeWorkItemId: string) => { creator: boolean };
  getWorkItemCommentConditionContext: (intakeWorkItemId: string, commentId: string) => { creator: boolean };
  getAdditionalWorkItemPermissionMeta: (intakeWorkItemId: string) => AdditionalIntakeWorkItemPermissionMeta;
};

export class IntakeWorkItemPermissionsInstance implements IntakeWorkItemPermissions {
  constructor(private args: IntakeWorkItemPermissionsArgs) {}

  getCanView: IntakeWorkItemPermissions["getCanView"] = computedFn((workspaceSlug, projectId) => {
    return this.args.can({
      resource: "intake",
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

  getCanCreate: IntakeWorkItemPermissions["getCanCreate"] = computedFn((workspaceSlug, projectId) => {
    return this.args.can({
      resource: "intake",
      action: "submit",
      projectId,
      workspaceSlug,
    });
  });

  getCanEdit: IntakeWorkItemPermissions["getCanEdit"] = computedFn((workspaceSlug, projectId, intakeWorkItemId) => {
    const additionalMeta = this.args.getAdditionalWorkItemPermissionMeta(intakeWorkItemId);
    return (
      !additionalMeta.isInDisabledStatus &&
      this.args.can({
        resource: "intake",
        action: "edit",
        projectId,
        workspaceSlug,
        resourceMeta: {
          resourceId: intakeWorkItemId,
          conditionContext: this.args.getIntakeConditionContext(intakeWorkItemId),
        },
      })
    );
  });

  getCanManage: IntakeWorkItemPermissions["getCanManage"] = computedFn((workspaceSlug, projectId, intakeWorkItemId) => {
    return this.args.can({
      resource: "intake",
      action: "manage",
      projectId,
      workspaceSlug,
      resourceMeta: { resourceId: intakeWorkItemId },
    });
  });

  getCanDelete: IntakeWorkItemPermissions["getCanDelete"] = computedFn((workspaceSlug, projectId, intakeWorkItemId) => {
    return this.args.can({
      resource: "intake",
      action: "delete",
      projectId,
      workspaceSlug,
      resourceMeta: {
        resourceId: intakeWorkItemId,
        conditionContext: this.args.getIntakeConditionContext(intakeWorkItemId),
      },
    });
  });

  getCanReact: IntakeWorkItemPermissions["getCanReact"] = computedFn((workspaceSlug, projectId, intakeWorkItemId) => {
    return this.args.can({
      resource: "intake",
      action: "react",
      projectId,
      workspaceSlug,
      resourceMeta: { resourceId: intakeWorkItemId },
    });
  });

  getCanEditProperty: IntakeWorkItemPermissions["getCanEditProperty"] = computedFn(
    (workspaceSlug, projectId, intakeWorkItemId) => {
      return this.getCanEdit(workspaceSlug, projectId, intakeWorkItemId);
    }
  );

  getCanAccept: IntakeWorkItemPermissions["getCanAccept"] = computedFn((workspaceSlug, projectId, intakeWorkItemId) => {
    const additionalMeta = this.args.getAdditionalWorkItemPermissionMeta(intakeWorkItemId);
    return additionalMeta.isInActionableStatus && this.getCanManage(workspaceSlug, projectId, intakeWorkItemId);
  });

  getCanDecline: IntakeWorkItemPermissions["getCanDecline"] = computedFn(
    (workspaceSlug, projectId, intakeWorkItemId) => {
      const additionalMeta = this.args.getAdditionalWorkItemPermissionMeta(intakeWorkItemId);
      return additionalMeta.isInActionableStatus && this.getCanManage(workspaceSlug, projectId, intakeWorkItemId);
    }
  );

  getCanMarkAsDuplicate: IntakeWorkItemPermissions["getCanMarkAsDuplicate"] = computedFn(
    (workspaceSlug, projectId, intakeWorkItemId) => {
      const additionalMeta = this.args.getAdditionalWorkItemPermissionMeta(intakeWorkItemId);
      return additionalMeta.isInActionableStatus && this.getCanManage(workspaceSlug, projectId, intakeWorkItemId);
    }
  );

  getCanRestoreDescriptionVersion: IntakeWorkItemPermissions["getCanRestoreDescriptionVersion"] = computedFn(() => {
    return false;
  });

  getCanAddAttachments: IntakeWorkItemPermissions["getCanAddAttachments"] = computedFn(
    (workspaceSlug, projectId, intakeWorkItemId) => {
      return this.getCanEdit(workspaceSlug, projectId, intakeWorkItemId);
    }
  );

  getCommentPermissions: IntakeWorkItemPermissions["getCommentPermissions"] = computedFn(
    (workspaceSlug, projectId, intakeWorkItemId) => {
      return new WorkItemCommentPermissionsInstance({
        can: this.args.can,
        workspaceSlug,
        projectId,
        getCommentConditionContext: (commentId) =>
          this.args.getWorkItemCommentConditionContext(intakeWorkItemId, commentId),
      });
    }
  );

  getCanAddWorklog: IntakeWorkItemPermissions["getCanAddWorklog"] = computedFn(() => {
    return false;
  });

  getCanExport: IntakeWorkItemPermissions["getCanExport"] = computedFn((workspaceSlug, projectId) => {
    return this.args.can({
      resource: "intake",
      action: "export",
      projectId,
      workspaceSlug,
    });
  });
}
