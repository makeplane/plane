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

import { makeObservable } from "mobx";
import type { CoreRootStore } from "@/store/root.store";
import type { IUpdateStore } from "./updates/base.store";
import { UpdateStore } from "./updates/base.store";
import { EpicMetaStore } from "./meta.store";
import type { IEpicMetaStore } from "./meta.store";

export interface IEpicBaseStore {
  updatesStore: IUpdateStore;
  epicMetaStore: IEpicMetaStore;
}

export class EpicBaseStore implements IEpicBaseStore {
  //store
  rootStore: CoreRootStore;
  updatesStore: IUpdateStore;
  epicMetaStore: IEpicMetaStore;

  constructor(public store: CoreRootStore) {
    makeObservable(this, {});
    // services
    this.rootStore = store;
    this.updatesStore = new UpdateStore();
    this.epicMetaStore = new EpicMetaStore();
  }
}
