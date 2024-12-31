/* eslint-disable no-useless-catch */

import set from "lodash/set";
import unset from "lodash/unset";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
// plane web services
import { GitlabEntityService } from "@/plane-web/services/integrations/gitlab";
// plane web store
import { IGitlabStore } from "@/plane-web/store/integrations";
// plane web types
import { TGitlabEntityConnection } from "@/plane-web/types/integrations/gitlab";

export interface IGitlabEntityStore {
  // store instances
  entityMap: Record<string, Record<string, Record<string, TGitlabEntityConnection>>>; // workspaceId -> workspaceConnectionId -> entityId -> entity
  // computed
  entityIds: string[];
  // computed functions
  entityById: (entityId: string) => TGitlabEntityConnection | undefined;
  // actions
  fetchEntities: () => Promise<TGitlabEntityConnection[] | undefined>;
  fetchEntity: (entityId: string) => Promise<TGitlabEntityConnection | undefined>;
  createEntity: (entity: Partial<TGitlabEntityConnection>) => Promise<TGitlabEntityConnection | undefined>;
  updateEntity: (
    entityId: string,
    entity: Partial<TGitlabEntityConnection>
  ) => Promise<TGitlabEntityConnection | undefined>;
  deleteEntity: (entityId: string) => Promise<void | undefined>;
}

export class GitlabEntityStore implements IGitlabEntityStore {
  // observables
  entityMap: Record<string, Record<string, Record<string, TGitlabEntityConnection>>> = {}; // workspaceId -> workspaceConnectionId -> entityId -> entity
  // service
  private service: GitlabEntityService;

  constructor(protected store: IGitlabStore) {
    makeObservable(this, {
      // observables
      entityMap: observable,
      // computed
      entityIds: computed,
      // actions
      fetchEntities: action,
      fetchEntity: action,
      createEntity: action,
      updateEntity: action,
      deleteEntity: action,
    });

    this.service = new GitlabEntityService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));
  }

  // computed
  /**
   * @description get entity ids
   * @returns { string[] }
   */
  get entityIds(): string[] {
    const workspaceId = this.store.workspace?.id || undefined;
    const workspaceConnectionId = this.store.auth.workspaceConnectionIds[0] || undefined;
    if (!workspaceId || !workspaceConnectionId || !this.entityMap?.[workspaceId]?.[workspaceConnectionId]) return [];

    return Object.keys(this.entityMap[workspaceId][workspaceConnectionId]);
  }

  // computed functions
  /**
   * @description get entity by id
   * @param { string } entityId
   * @returns { TGitlabEntityConnection | undefined }
   */
  entityById = computedFn((entityId: string): TGitlabEntityConnection | undefined => {
    const workspaceId = this.store.workspace?.id || undefined;
    const workspaceConnectionId = this.store.auth.workspaceConnectionIds[0] || undefined;
    if (!workspaceId || !workspaceConnectionId || !entityId || !this.entityMap?.[workspaceId]?.[workspaceConnectionId])
      return undefined;

    return this.entityMap[workspaceId][workspaceConnectionId][entityId];
  });

  // actions
  /**
   * @description fetch entities
   * @returns { Promise<TGitlabEntityConnection[] | undefined> }
   */
  fetchEntities = async (): Promise<TGitlabEntityConnection[] | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id || undefined;
      const workspaceConnectionId = this.store.auth.workspaceConnectionIds[0] || undefined;
      if (!workspaceId || !workspaceConnectionId) return;

      const response = await this.service.fetchEntityConnections(workspaceId, workspaceConnectionId);

      if (response) {
        runInAction(() => {
          response.forEach((data) => {
            set(this.entityMap, [workspaceId, workspaceConnectionId, data.id], data);
          });
        });
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description fetch entity
   * @param { string } entityId
   * @returns { Promise<TGitlabEntityConnection | undefined> }
   */
  fetchEntity = async (entityId: string): Promise<TGitlabEntityConnection | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id || undefined;
      const workspaceConnectionId = this.store.auth.workspaceConnectionIds[0] || undefined;
      if (!workspaceId || !workspaceConnectionId || !entityId) return;

      const response = await this.service.fetchEntityConnection(workspaceId, workspaceConnectionId, entityId);

      if (response) {
        runInAction(() => {
          set(this.entityMap, [workspaceId, workspaceConnectionId, response.id], response);
        });
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description create entity
   * @param { Partial<TGitlabEntityConnection> } entity
   * @returns { Promise<TGitlabEntityConnection | undefined> }
   */
  createEntity = async (entity: Partial<TGitlabEntityConnection>): Promise<TGitlabEntityConnection | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id || undefined;
      const workspaceSlug = this.store.workspace?.slug || undefined;
      const workspaceConnectionId = this.store.auth.workspaceConnectionIds[0] || undefined;
      if (!workspaceId || !workspaceSlug || !workspaceConnectionId) return;

      const gitlabRepoId = entity?.entityId || undefined;
      if (!gitlabRepoId) return;

      const gitlabRepo = this.store.data.gitlabRepositoryById(gitlabRepoId) || undefined;
      if (!gitlabRepo) return;

      const payload: Partial<TGitlabEntityConnection> = {
        workspaceId: workspaceId,
        workspaceSlug: workspaceSlug,
        projectId: entity.projectId,
        workspaceConnectionId: workspaceConnectionId,
        entityId: entity.entityId,
        entitySlug: gitlabRepo.full_name,
        entityData: gitlabRepo,
        config: entity.config,
      };

      const response = await this.service.createEntityConnection(workspaceId, workspaceConnectionId, payload);

      if (response) {
        runInAction(() => {
          set(this.entityMap, [workspaceId, workspaceConnectionId, response.id], response);
        });
      }

      await this.fetchEntities();

      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description update entity
   * @param { string } entityId
   * @param { Partial<TGitlabEntityConnection> } entity
   * @returns { Promise<TGitlabEntityConnection | undefined> }
   */
  updateEntity = async (
    entityId: string,
    entity: Partial<TGitlabEntityConnection>
  ): Promise<TGitlabEntityConnection | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id || undefined;
      const workspaceSlug = this.store.workspace?.slug || undefined;
      const workspaceConnectionId = this.store.auth.workspaceConnectionIds[0] || undefined;
      if (!workspaceId || !workspaceSlug || !workspaceConnectionId || !entityId) return;

      const gitlabRepoId = entity?.entityId || undefined;
      if (!gitlabRepoId) return;

      const gitlabRepo = this.store.data.gitlabRepositoryById(gitlabRepoId) || undefined;
      if (!gitlabRepo) return;

      const payload: Partial<TGitlabEntityConnection> = {
        workspaceId: workspaceId,
        workspaceSlug: workspaceSlug,
        projectId: entity.projectId,
        workspaceConnectionId: workspaceConnectionId,
        entityId: entity.entityId,
        entitySlug: gitlabRepo.full_name,
        entityData: gitlabRepo,
        config: entity.config,
      };

      const response = await this.service.updateEntityConnection(workspaceId, workspaceConnectionId, entityId, payload);

      if (response) {
        runInAction(() => {
          set(this.entityMap, [workspaceId, workspaceConnectionId, response.id], response);
        });
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description delete entity
   * @param { string } entityId
   * @returns { Promise<void | undefined> }
   */
  deleteEntity = async (entityId: string): Promise<void | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id || undefined;
      const workspaceConnectionId = this.store.auth.workspaceConnectionIds[0] || undefined;
      if (!workspaceId || !workspaceConnectionId || !entityId) return;

      await this.service.deleteEntityConnection(workspaceId, workspaceConnectionId, entityId);
      unset(this.entityMap, [workspaceId, workspaceConnectionId, entityId]);

      return;
    } catch (error) {
      throw error;
    }
  };
}
