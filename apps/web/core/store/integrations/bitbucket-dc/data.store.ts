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

/* oxlint-disable no-useless-catch */

import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import type { TBitbucketRepository } from "@plane/types";
import { BitbucketDataService } from "@/services/integrations/bitbucket-dc";
import type { IBitbucketStore } from "./root.store";

export interface IBitbucketDataStore {
  bitbucketRepositories: Record<string, Record<string, TBitbucketRepository>>;
  bitbucketRepositoryIds: string[];
  bitbucketRepositoryById: (id: string) => TBitbucketRepository | undefined;
  fetchBitbucketRepositories: () => Promise<TBitbucketRepository[] | undefined>;
}

export class BitbucketDataStore implements IBitbucketDataStore {
  bitbucketRepositories: Record<string, Record<string, TBitbucketRepository>> = {};
  private service: BitbucketDataService;

  constructor(protected store: IBitbucketStore) {
    makeObservable(this, {
      bitbucketRepositories: observable,
      bitbucketRepositoryIds: computed,
      fetchBitbucketRepositories: action,
    });

    this.service = new BitbucketDataService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));
  }

  get bitbucketRepositoryIds(): string[] {
    const connectionId = this.store.auth.workspaceConnectionIds[0];
    if (!connectionId) return [];
    const repos = this.bitbucketRepositories[connectionId];
    if (!repos) return [];
    return Object.keys(repos);
  }

  bitbucketRepositoryById = computedFn((id: string): TBitbucketRepository | undefined => {
    const connectionId = this.store.auth.workspaceConnectionIds[0];
    if (!connectionId) return undefined;
    return this.bitbucketRepositories[connectionId]?.[id] ?? undefined;
  });

  fetchBitbucketRepositories = async (): Promise<TBitbucketRepository[] | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id;
      const connectionId = this.store.auth.workspaceConnectionIds[0];
      if (!workspaceId || !connectionId) return undefined;

      const response = await this.service.fetchBitbucketRepositories(workspaceId);
      if (response) {
        runInAction(() => {
          response.forEach((repo) => {
            this.bitbucketRepositories[connectionId] = this.bitbucketRepositories[connectionId] || {};
            this.bitbucketRepositories[connectionId][repo.id] = repo;
          });
        });
      }
      return response;
    } catch (error) {
      throw error;
    }
  };
}
