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
import type { IIntegrationBaseStore } from "../base.store";
import type { IGitlabAuthStore, IGitlabDataStore, IGitlabEntityConnectionStore } from "../gitlab";
import { IntegrationBaseStore } from "../base.store";
import { GitlabAuthStore, GitlabDataStore, GitlabEntityStore } from "../gitlab";
import type { RootStore } from "@/plane-web/store/root.store";

export interface IGitlabEnterpriseStore extends IIntegrationBaseStore {
  // store instances
  auth: IGitlabAuthStore;
  data: IGitlabDataStore;
  entityConnection: IGitlabEntityConnectionStore;
}

export class GitlabEnterpriseStore extends IntegrationBaseStore implements IGitlabEnterpriseStore {
  // store instances
  auth: IGitlabAuthStore;
  data: IGitlabDataStore;
  entityConnection: IGitlabEntityConnectionStore;

  constructor(protected store: RootStore) {
    super(store);
    makeObservable(this, {});

    // store instances
    this.auth = new GitlabAuthStore(this, true);
    this.data = new GitlabDataStore(this, true);
    this.entityConnection = new GitlabEntityStore(this, true);
  }
}
