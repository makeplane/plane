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

import { computed, makeObservable } from "mobx";
import { computedFn } from "mobx-utils";
import type { PermissionCheckArgs } from "@plane/types";

export interface TeamspaceViewPermissions {
  canCreate: boolean;
  getCanEdit: (viewId: string) => boolean;
  getCanDelete: (viewId: string) => boolean;
  getCanPublish: (viewId: string) => boolean;
}

export type TeamspaceViewPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
  workspaceSlug: string;
  teamspaceId: string;
  getViewConditionContext: (viewId: string) => { creator: boolean };
};

export class TeamspaceViewPermissionsInstance implements TeamspaceViewPermissions {
  constructor(private args: TeamspaceViewPermissionsArgs) {
    makeObservable(this, {
      canCreate: computed,
    });
  }

  get canCreate(): boolean {
    return this.args.can({
      resource: "teamspace_workitem_view",
      action: "create",
      workspaceSlug: this.args.workspaceSlug,
      teamspaceId: this.args.teamspaceId,
    });
  }

  getCanEdit: TeamspaceViewPermissions["getCanEdit"] = computedFn((viewId) => {
    return this.args.can({
      resource: "teamspace_workitem_view",
      action: "edit",
      workspaceSlug: this.args.workspaceSlug,
      teamspaceId: this.args.teamspaceId,
      resourceMeta: {
        resourceId: viewId,
        conditionContext: this.args.getViewConditionContext(viewId),
      },
    });
  });

  getCanDelete: TeamspaceViewPermissions["getCanDelete"] = computedFn((viewId) => {
    return this.args.can({
      resource: "teamspace_workitem_view",
      action: "delete",
      workspaceSlug: this.args.workspaceSlug,
      teamspaceId: this.args.teamspaceId,
      resourceMeta: {
        resourceId: viewId,
        conditionContext: this.args.getViewConditionContext(viewId),
      },
    });
  });

  getCanPublish: TeamspaceViewPermissions["getCanPublish"] = computedFn(() => {
    return false; // TODO: Publish operation is not supported for teamspace views right now
  });
}
