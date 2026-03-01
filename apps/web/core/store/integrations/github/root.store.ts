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

// stores
import { makeObservable } from "mobx";
// plane web store
import type { IIntegrationBaseStore, IGithubAuthStore, IGithubDataStore, IGithubEntityStore } from "../";
import { IntegrationBaseStore, GithubAuthStore, GithubDataStore, GithubEntityStore } from "../";
import type { RootStore } from "@/plane-web/store/root.store";

export interface IGithubStore extends IIntegrationBaseStore {
  // store instances
  auth: IGithubAuthStore;
  data: IGithubDataStore;
  entity: IGithubEntityStore;
}

export class GithubStore extends IntegrationBaseStore implements IGithubStore {
  // store instances
  auth: IGithubAuthStore;
  data: IGithubDataStore;
  entity: IGithubEntityStore;

  constructor(protected store: RootStore) {
    super(store);
    makeObservable(this, {});

    // store instances
    this.auth = new GithubAuthStore(this);
    this.data = new GithubDataStore(this);
    this.entity = new GithubEntityStore(this);
  }
}
