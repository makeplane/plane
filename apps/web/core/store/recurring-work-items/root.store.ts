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
// root store
import type { RootStore } from "@/plane-web/store/root.store";
// recurring work items stores
import type { IRecurringWorkItemActivityStore } from "./activity.store";
import { RecurringWorkItemActivityStore } from "./activity.store";
import type { IRecurringWorkItemStore } from "./base.store";
import { RecurringWorkItemStore } from "./base.store";

export interface IRecurringWorkItemsRootStore {
  recurringWorkItems: IRecurringWorkItemStore;
  recurringWorkItemActivities: IRecurringWorkItemActivityStore;
}

export class RecurringWorkItemsRootStore implements IRecurringWorkItemsRootStore {
  recurringWorkItems: IRecurringWorkItemStore;
  recurringWorkItemActivities: IRecurringWorkItemActivityStore;
  root: RootStore;

  constructor(root: RootStore) {
    this.root = root;
    this.recurringWorkItems = new RecurringWorkItemStore({
      getWorkspaceSlugById: this.getWorkspaceSlugById.bind(this),
      getWorkspaceIdBySlug: this.getWorkspaceIdBySlug.bind(this),
      currentUserId: this.currentUserId,
      can: this.root.permissionAccessStore.can,
    });
    this.recurringWorkItemActivities = new RecurringWorkItemActivityStore();
  }

  // computed functions
  get currentUserId() {
    return this.root.user.data?.id;
  }

  // helper actions
  private getWorkspaceSlugById = computedFn((workspaceId: string) => {
    return this.root.workspaceRoot.getWorkspaceById(workspaceId)?.slug;
  });

  private getWorkspaceIdBySlug = computedFn((workspaceSlug: string) => {
    return this.root.workspaceRoot.getWorkspaceBySlug(workspaceSlug)?.id;
  });
}
