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
import type { IIntegrationBaseStore, IGitlabAuthStore, IGitlabDataStore, IGitlabEntityConnectionStore } from "../";
import { IntegrationBaseStore, GitlabAuthStore, GitlabDataStore, GitlabEntityStore } from "../";
import type { RootStore } from "@/plane-web/store/root.store";

export interface IGitlabStore extends IIntegrationBaseStore {
  // store instances
  auth: IGitlabAuthStore;
  data: IGitlabDataStore;
  entityConnection: IGitlabEntityConnectionStore;
}

export class GitlabStore extends IntegrationBaseStore implements IGitlabStore {
  // store instances
  auth: IGitlabAuthStore;
  data: IGitlabDataStore;
  entityConnection: IGitlabEntityConnectionStore;

  constructor(protected store: RootStore) {
    super(store);
    makeObservable(this, {});

    // store instances
    this.auth = new GitlabAuthStore(this);
    this.data = new GitlabDataStore(this);
    this.entityConnection = new GitlabEntityStore(this);
  }
}
