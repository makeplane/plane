/* eslint-disable no-useless-catch */

import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
// plane web services
import { IGitlabEntity } from "@plane/etl/gitlab";
import { GitlabDataService } from "@/plane-web/services/integrations/gitlab";
// plane web store
import { IGitlabStore } from "@/plane-web/store/integrations";
// plane web types
import { TGitlabRepository } from "@/plane-web/types/integrations/gitlab";

export interface IGitlabDataStore {
  // store instances
  gitlabRepositories: Record<string, Record<string, TGitlabRepository>>; // organizationId -> gitlabRepositoryId -> TGitlabRepository
  gitlabUsers: Record<string, Record<string, object>>; // organizationId -> gitlabUserId -> gitlabUser
  gitlabEntities: Record<string, Record<string, IGitlabEntity>>; // organizationId -> gitlabRepositoryId -> IGitlabEntity
  // computed
  gitlabRepositoryIds: string[];
  gitlabUserIds: string[] | undefined;
  gitlabEntityIds: string[] | undefined;
  // computed functions
  gitlabRepositoryById: (gitlabRepositoryId: string) => TGitlabRepository | undefined;
  gitlabUserById: (gitlabUserId: string) => object | undefined;
  gitlabEntityById: (gitlabEntityId: string) => IGitlabEntity | undefined;
  // actions
  fetchGitlabRepositories: () => Promise<object | undefined>;
  fetchGitlabUsers: () => Promise<object | undefined>;
  fetchGitlabEntities: () => Promise<IGitlabEntity[] | undefined>;
}

export class GitlabDataStore implements IGitlabDataStore {
  // observables
  gitlabRepositories: Record<string, Record<string, TGitlabRepository>> = {}; // organizationId -> gitlabRepositoryId -> TGitlabRepository
  gitlabUsers: Record<string, Record<string, object>> = {}; // organizationId -> gitlabUserId -> gitlabUser
  gitlabEntities: Record<string, Record<string, IGitlabEntity>> = {}; // organizationId -> gitlabRepositoryId -> IGitlabEntity

  // service
  private service: GitlabDataService;

  constructor(protected store: IGitlabStore) {
    makeObservable(this, {
      // observables
      gitlabRepositories: observable,
      gitlabUsers: observable,
      gitlabEntities: observable,
      // computed
      gitlabRepositoryIds: computed,
      gitlabUserIds: computed,
      gitlabEntityIds: computed,
      // computed functions
      fetchGitlabRepositories: action,
      fetchGitlabUsers: action,
      fetchGitlabEntities: action,
    });

    this.service = new GitlabDataService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));
  }

  // computed
  /**
   * @description get gitlab repository ids
   * @returns { string[]  }
   */
  get gitlabRepositoryIds(): string[] {
    const organizationId = this.store.auth.workspaceConnectionIds[0];
    if (!organizationId) return [];

    const gitlabRepositories = this.gitlabRepositories[organizationId];
    if (!gitlabRepositories) return [];

    return Object.keys(gitlabRepositories);
  }

  /**
   * @description get gitlab user ids
   * @returns { string[] | undefined }
   */
  get gitlabUserIds(): string[] | undefined {
    const organizationId = this.store.auth.workspaceConnectionIds[0];
    if (!organizationId) return;

    const gitlabUsers = this.gitlabUsers[organizationId];
    if (!gitlabUsers) return;

    return Object.keys(gitlabUsers);
  }

  /**
   * @description get gitlab entity ids
   * @returns { string[] | undefined }
   */
  get gitlabEntityIds(): string[] | undefined {
    const organizationId = this.store.auth.workspaceConnectionIds[0];
    if (!organizationId) return;

    const gitlabEntities = this.gitlabEntities[organizationId];
    if (!gitlabEntities) return;

    return Object.keys(gitlabEntities);
  }

  // computed functions
  /**
   * @description get gitlab repository by id
   * @param { string } gitlabRepositoryId
   * @returns { TGitlabRepository | undefined }
   */
  gitlabRepositoryById = computedFn((gitlabRepositoryId: string): TGitlabRepository | undefined => {
    const organizationId = this.store.auth.workspaceConnectionIds[0];
    if (!organizationId) return;

    const gitlabRepositories = this.gitlabRepositories[organizationId];
    if (!gitlabRepositories) return;

    return gitlabRepositories[gitlabRepositoryId] || undefined;
  });

  /**
   * @description get gitlab user by id
   * @param { string } gitlabUserId
   * @returns { object | undefined }
   */
  gitlabUserById = computedFn((gitlabUserId: string): object | undefined => {
    const organizationId = this.store.auth.workspaceConnectionIds[0];
    if (!organizationId) return;

    const gitlabUsers = this.gitlabUsers[organizationId];
    if (!gitlabUsers) return;

    return gitlabUsers[gitlabUserId] || undefined;
  });

   /**
   * @description get gitlab entity by id
   * @param { string } gitlabEntityId
   * @returns { IGitlabEntity | undefined }
   */
   gitlabEntityById = computedFn((gitlabEntityId: string): IGitlabEntity | undefined => {
    const organizationId = this.store.auth.workspaceConnectionIds[0];
    if (!organizationId) return;

    const gitlabEntities = this.gitlabEntities[organizationId];
    if (!gitlabEntities) return;

    return gitlabEntities[gitlabEntityId] || undefined;
  });


  // actions
  /**
   * @description fetch gitlab repositories
   * @returns { Promise<TGitlabRepository[] | undefined> }
   */
  fetchGitlabRepositories = async (): Promise<TGitlabRepository[] | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id;
      const organizationId = this.store.auth.workspaceConnectionIds[0];

      if (!workspaceId || !organizationId) return undefined;

      const response = await this.service.fetchGitlabRepositories(workspaceId);

      if (response) {
        runInAction(() => {
          response.forEach((data) => {
            this.gitlabRepositories[organizationId] = this.gitlabRepositories[organizationId] || {};
            this.gitlabRepositories[organizationId][data.id] = data;
          });
        });
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description fetch gitlab users
   * @returns { Promise<object | undefined> }
   */
  fetchGitlabUsers = async (): Promise<object | undefined> => {
    try {
      const organizationId = this.store.auth.workspaceConnectionIds[0];
      if (!organizationId) return;

      return undefined;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description fetch gitlab entities
   * @returns { Promise<IGitlabEntity[]> }
   */
  fetchGitlabEntities = async (): Promise<IGitlabEntity[]> => {
    try {
      const workspaceId = this.store.workspace?.id;
      const organizationId = this.store.auth.workspaceConnectionIds[0];

      if (!workspaceId || !organizationId) return [];

      const response = await this.service.fetchGitlabEntities(workspaceId);

      if (response) {
        runInAction(() => {
          response.forEach((data) => {
            this.gitlabEntities[organizationId] = this.gitlabEntities[organizationId] || {};
            this.gitlabEntities[organizationId][data.id] = data;
          });
        });
      }

      return response;
    } catch (error) {
      throw error;
    }
  };
}
