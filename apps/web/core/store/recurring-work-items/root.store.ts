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

  constructor(root: RootStore) {
    this.recurringWorkItems = new RecurringWorkItemStore(root);
    this.recurringWorkItemActivities = new RecurringWorkItemActivityStore();
  }
}
