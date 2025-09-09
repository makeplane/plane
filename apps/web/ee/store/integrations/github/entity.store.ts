/* eslint-disable no-useless-catch */

import set from "lodash/set";
import unset from "lodash/unset";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
// plane web services
import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { GithubEntityService } from "@/plane-web/services/integrations/github";
// plane web store
import { IGithubStore } from "@/plane-web/store/integrations";
// plane web types
import { TGithubEntityConnection } from "@/plane-web/types/integrations";

export interface IGithubEntityStore {
  // store instances
  entityMap: Record<string, Record<string, Record<string, TGithubEntityConnection>>>; // workspaceId -> workspaceConnectionId -> entityId -> entity
  // computed
  entityIds: string[];
  // computed functions
  entityById: (entityId: string) => TGithubEntityConnection | undefined;
  // actions
  fetchEntities: () => Promise<TGithubEntityConnection[] | undefined>;
  fetchEntity: (entityId: string) => Promise<TGithubEntityConnection | undefined>;
  createEntity: (entity: Partial<TGithubEntityConnection>) => Promise<TGithubEntityConnection | undefined>;
  updateEntity: (
    entityId: string,
    entity: Partial<TGithubEntityConnection>
  ) => Promise<TGithubEntityConnection | undefined>;
  deleteEntity: (entityId: string) => Promise<void | undefined>;
}

export class GithubEntityStore implements IGithubEntityStore {
  // observables
  entityMap: Record<string, Record<string, Record<string, TGithubEntityConnection>>> = {}; // workspaceId -> workspaceConnectionId -> entityId -> entity
  // service
  private service: GithubEntityService;
  private isEnterprise: boolean;

  constructor(
    protected store: IGithubStore,
    isEnterprise: boolean = false
  ) {
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

    this.isEnterprise = isEnterprise;
    this.service = new GithubEntityService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));
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
   * @returns { TGithubEntityConnection | undefined }
   */
  entityById = computedFn((entityId: string): TGithubEntityConnection | undefined => {
    const workspaceId = this.store.workspace?.id || undefined;
    const workspaceConnectionId = this.store.auth.workspaceConnectionIds[0] || undefined;
    if (!workspaceId || !workspaceConnectionId || !entityId || !this.entityMap?.[workspaceId]?.[workspaceConnectionId])
      return undefined;

    return this.entityMap[workspaceId][workspaceConnectionId][entityId];
  });

  // actions
  /**
   * @description fetch entities
   * @returns { Promise<TGithubEntityConnection[] | undefined> }
   */
  fetchEntities = async (): Promise<TGithubEntityConnection[] | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id || undefined;
      const workspaceConnectionId = this.store.auth.workspaceConnectionIds[0] || undefined;
      if (!workspaceId || !workspaceConnectionId) return;

      const entityType = this.isEnterprise ? E_INTEGRATION_KEYS.GITHUB_ENTERPRISE : E_INTEGRATION_KEYS.GITHUB;
      const response = await this.service.fetchEntityConnections(workspaceId, workspaceConnectionId, entityType);

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
   * @returns { Promise<TGithubEntityConnection | undefined> }
   */
  fetchEntity = async (entityId: string): Promise<TGithubEntityConnection | undefined> => {
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
   * @param { Partial<TGithubEntityConnection> } entity
   * @returns { Promise<TGithubEntityConnection | undefined> }
   */
  createEntity = async (entity: Partial<TGithubEntityConnection>): Promise<TGithubEntityConnection | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id || undefined;
      const workspaceSlug = this.store.workspace?.slug || undefined;
      const workspaceConnectionId = this.store.auth.workspaceConnectionIds[0] || undefined;
      if (!workspaceId || !workspaceSlug || !workspaceConnectionId) return;

      const githubRepoId = entity?.entity_id || undefined;
      if (!githubRepoId) return;

      const githubRepo = this.store.data.githubRepositoryById(githubRepoId) || undefined;
      if (!githubRepo) return;

      const payload: Partial<TGithubEntityConnection> = {
        workspace_id: workspaceId,
        workspace_slug: workspaceSlug,
        project_id: entity.project_id,
        workspace_connection_id: workspaceConnectionId,
        entity_id: entity.entity_id,
        entity_type: this.isEnterprise ? E_INTEGRATION_KEYS.GITHUB_ENTERPRISE : E_INTEGRATION_KEYS.GITHUB,
        entity_slug: githubRepo.full_name,
        entity_data: githubRepo,
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
   * @param { Partial<TGithubEntityConnection> } entity
   * @returns { Promise<TGithubEntityConnection | undefined> }
   */
  updateEntity = async (
    entityId: string,
    entity: Partial<TGithubEntityConnection>
  ): Promise<TGithubEntityConnection | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id || undefined;
      const workspaceSlug = this.store.workspace?.slug || undefined;
      const workspaceConnectionId = this.store.auth.workspaceConnectionIds[0] || undefined;
      if (!workspaceId || !workspaceSlug || !workspaceConnectionId || !entityId) return;

      const githubRepoId = entity?.entity_id || undefined;
      if (!githubRepoId) return;

      const githubRepo = this.store.data.githubRepositoryById(githubRepoId) || undefined;
      if (!githubRepo) return;

      const payload: Partial<TGithubEntityConnection> = {
        workspace_id: workspaceId,
        workspace_slug: workspaceSlug,
        project_id: entity.project_id,
        workspace_connection_id: workspaceConnectionId,
        entity_id: entity.entity_id,
        entity_slug: githubRepo.full_name,
        entity_data: githubRepo,
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
