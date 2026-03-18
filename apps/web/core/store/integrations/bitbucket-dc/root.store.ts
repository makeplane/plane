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
import type { IIntegrationBaseStore } from "../";
import { IntegrationBaseStore } from "../";
import type { IBitbucketAuthStore } from "./auth.store";
import type { IBitbucketDataStore } from "./data.store";
import type { IBitbucketEntityStore } from "./entity.store";
import { BitbucketAuthStore, BitbucketDataStore, BitbucketEntityStore } from "./";
import type { RootStore } from "@/plane-web/store/root.store";

export interface IBitbucketStore extends IIntegrationBaseStore {
  auth: IBitbucketAuthStore;
  data: IBitbucketDataStore;
  entity: IBitbucketEntityStore;
}

export class BitbucketStore extends IntegrationBaseStore implements IBitbucketStore {
  auth: IBitbucketAuthStore;
  data: IBitbucketDataStore;
  entity: IBitbucketEntityStore;

  constructor(protected store: RootStore) {
    super(store);
    makeObservable(this, {});

    this.auth = new BitbucketAuthStore(this);
    this.data = new BitbucketDataStore(this);
    this.entity = new BitbucketEntityStore(this);
  }
}
