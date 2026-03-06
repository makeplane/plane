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

import { enableStaticRendering } from "mobx-react";
// stores
import type { IInstanceFeatureFlagsStore } from "@/plane-admin/store/instance-feature-flags.store";
import { InstanceFeatureFlagsStore } from "@/plane-admin/store/instance-feature-flags.store";
import { CoreRootStore } from "@/store/root.store";
import type { IInstanceManagementStore } from "./instance-management.store";
import { InstanceManagementStore } from "./instance-management.store";
import type { IInstanceUserStore } from "./instance-user.store";
import { InstanceUserStore } from "./instance-user.store";
// plane admin store

enableStaticRendering(typeof window === "undefined");

export class RootStore extends CoreRootStore {
  instanceFeatureFlags: IInstanceFeatureFlagsStore;
  instanceManagement: IInstanceManagementStore;
  instanceUser: IInstanceUserStore;

  constructor() {
    super();
    this.instanceFeatureFlags = new InstanceFeatureFlagsStore();
    this.instanceManagement = new InstanceManagementStore(this);
    this.instanceUser = new InstanceUserStore(this);
  }

  hydrate(initialData: any) {
    super.hydrate(initialData);
    this.instanceFeatureFlags.hydrate(initialData.instanceFeatureFlags);
  }

  resetOnSignOut() {
    super.resetOnSignOut();
    this.instanceFeatureFlags = new InstanceFeatureFlagsStore();
    this.instanceManagement = new InstanceManagementStore(this);
    this.instanceUser = new InstanceUserStore(this);
  }
}
