/* eslint-disable no-useless-catch */

import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
// plane web services
import { GithubDataService } from "@/plane-web/services/integrations/github";
// plane web store
import { IGithubStore } from "@/plane-web/store/integrations";
// plane web types
import { TGithubRepository } from "@/plane-web/types/integrations";

export interface IGithubDataStore {
  // store instances
  githubRepositories: Record<string, Record<string, TGithubRepository>>; // organizationId -> githubRepositoryId -> TGithubRepository
  githubUsers: Record<string, Record<string, object>>; // organizationId -> githubUserId -> githubUser
  // computed
  githubRepositoryIds: string[];
  githubUserIds: string[] | undefined;
  // computed functions
  githubRepositoryById: (githubRepositoryId: string) => TGithubRepository | undefined;
  githubUserById: (githubUserId: string) => object | undefined;
  // actions
  fetchGithubRepositories: () => Promise<object | undefined>;
  fetchGithubUsers: () => Promise<object | undefined>;
}

export class GithubDataStore implements IGithubDataStore {
  // observables
  githubRepositories: Record<string, Record<string, TGithubRepository>> = {}; // organizationId -> githubRepositoryId -> TGithubRepository
  githubUsers: Record<string, Record<string, object>> = {}; // organizationId -> githubUserId -> githubUser
  // service
  private service: GithubDataService;
  private isEnterprise: boolean;

  constructor(protected store: IGithubStore, isEnterprise: boolean = false) {
    makeObservable(this, {
      // observables
      githubRepositories: observable,
      githubUsers: observable,
      // computed
      githubRepositoryIds: computed,
      githubUserIds: computed,
      // computed functions
      fetchGithubRepositories: action,
      fetchGithubUsers: action,
    });

    this.isEnterprise = isEnterprise;
    this.service = new GithubDataService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH), isEnterprise);
  }

  // computed
  /**
   * @description get github repository ids
   * @returns { string[]  }
   */
  get githubRepositoryIds(): string[] {
    const organizationId = this.store.auth.workspaceConnectionIds[0];
    if (!organizationId) return [];

    const githubRepositories = this.githubRepositories[organizationId];
    if (!githubRepositories) return [];

    return Object.keys(githubRepositories);
  }

  /**
   * @description get github user ids
   * @returns { string[] | undefined }
   */
  get githubUserIds(): string[] | undefined {
    const organizationId = this.store.auth.workspaceConnectionIds[0];
    if (!organizationId) return;

    const githubUsers = this.githubUsers[organizationId];
    if (!githubUsers) return;

    return Object.keys(githubUsers);
  }

  // computed functions
  /**
   * @description get github repository by id
   * @param { string } githubRepositoryId
   * @returns { TGithubRepository | undefined }
   */
  githubRepositoryById = computedFn((githubRepositoryId: string): TGithubRepository | undefined => {
    const organizationId = this.store.auth.workspaceConnectionIds[0];
    if (!organizationId) return;

    const githubRepositories = this.githubRepositories[organizationId];
    if (!githubRepositories) return;

    return githubRepositories[githubRepositoryId] || undefined;
  });

  /**
   * @description get github user by id
   * @param { string } githubUserId
   * @returns { object | undefined }
   */
  githubUserById = computedFn((githubUserId: string): object | undefined => {
    const organizationId = this.store.auth.workspaceConnectionIds[0];
    if (!organizationId) return;

    const githubUsers = this.githubUsers[organizationId];
    if (!githubUsers) return;

    return githubUsers[githubUserId] || undefined;
  });

  // actions
  /**
   * @description fetch github repositories
   * @returns { Promise<TGithubRepository[] | undefined> }
   */
  fetchGithubRepositories = async (): Promise<TGithubRepository[] | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id;
      const organizationId = this.store.auth.workspaceConnectionIds[0];

      if (!workspaceId || !organizationId) return undefined;

      const response = await this.service.fetchGithubRepositories(workspaceId);

      if (response) {
        runInAction(() => {
          response.forEach((data) => {
            this.githubRepositories[organizationId] = this.githubRepositories[organizationId] || {};
            this.githubRepositories[organizationId][data.id] = data;
          });
        });
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description fetch github users
   * @returns { Promise<object | undefined> }
   */
  fetchGithubUsers = async (): Promise<object | undefined> => {
    try {
      const organizationId = this.store.auth.workspaceConnectionIds[0];
      if (!organizationId) return;

      return undefined;
    } catch (error) {
      throw error;
    }
  };
}
