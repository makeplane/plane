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

/* eslint-disable no-useless-catch */

import { unset, set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
// plane web services
import type { TGitlabEntityConnection } from "@plane/types";
import { GitlabEntityService } from "@/services/integrations/gitlab";
import type { IGitlabStore } from "./root.store";
// plane web store

export interface IGitlabEntityConnectionStore {
  // store instances
  entityConnectionMap: Record<string, Record<string, Record<string, TGitlabEntityConnection>>>; // workspaceId -> workspaceConnectionId -> connectionId -> entity
  // computed
  entityConnectionIds: string[];
  // computed functions
  entityConnectionById: (entityId: string) => TGitlabEntityConnection | undefined;
  // actions
  fetchEntityConnections: () => Promise<TGitlabEntityConnection[] | undefined>;
  fetchEntityConnection: (entityId: string) => Promise<TGitlabEntityConnection | undefined>;
  createEntityConnection: (entity: Partial<TGitlabEntityConnection>) => Promise<TGitlabEntityConnection | undefined>;
  createEntityConnectionV2: (entity: Partial<TGitlabEntityConnection>) => Promise<TGitlabEntityConnection | undefined>;
  createProjectConnection: (entity: Partial<TGitlabEntityConnection>) => Promise<TGitlabEntityConnection | undefined>;
  updateEntityConnection: (
    connectionId: string,
    entity: Partial<TGitlabEntityConnection>
  ) => Promise<TGitlabEntityConnection | undefined>;
  deleteEntityConnection: (connectionId: string) => Promise<void | undefined>;
}

export class GitlabEntityStore implements IGitlabEntityConnectionStore {
  // observables
  entityConnectionMap: Record<string, Record<string, Record<string, TGitlabEntityConnection>>> = {}; // workspaceId -> workspaceConnectionId -> connectionId -> entity
  // service
  private service: GitlabEntityService;
  private isEnterprise: boolean;
  constructor(
    protected store: IGitlabStore,
    isEnterprise: boolean = false
  ) {
    makeObservable(this, {
      // observables
      entityConnectionMap: observable,
      // computed
      entityConnectionIds: computed,
      // actions
      fetchEntityConnections: action,
      fetchEntityConnection: action,
      createEntityConnection: action,
      createEntityConnectionV2: action,
      createProjectConnection: action,
      updateEntityConnection: action,
      deleteEntityConnection: action,
    });

    this.isEnterprise = isEnterprise;
    this.service = new GitlabEntityService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH), isEnterprise);
  }

  // computed
  /**
   * @description get entity ids
   * @returns { string[] }
   */
  get entityConnectionIds(): string[] {
    const workspaceId = this.store.workspace?.id || undefined;
    const workspaceConnectionId = this.store.auth.workspaceConnectionIds[0] || undefined;
    if (!workspaceId || !workspaceConnectionId || !this.entityConnectionMap?.[workspaceId]?.[workspaceConnectionId])
      return [];

    return Object.keys(this.entityConnectionMap[workspaceId][workspaceConnectionId]);
  }

  // computed functions
  /**
   * @description get entity by id
   * @param { string } connectionId
   * @returns { TGitlabEntityConnection | undefined }
   */
  entityConnectionById = computedFn((connectionId: string): TGitlabEntityConnection | undefined => {
    const workspaceId = this.store.workspace?.id || undefined;
    const workspaceConnectionId = this.store.auth.workspaceConnectionIds[0] || undefined;
    if (
      !workspaceId ||
      !workspaceConnectionId ||
      !connectionId ||
      !this.entityConnectionMap?.[workspaceId]?.[workspaceConnectionId]
    )
      return undefined;

    return this.entityConnectionMap[workspaceId][workspaceConnectionId][connectionId];
  });

  // actions
  /**
   * @description fetch entities
   * @returns { Promise<TGitlabEntityConnection[] | undefined> }
   */
  fetchEntityConnections = async (): Promise<TGitlabEntityConnection[] | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id || undefined;
      const workspaceConnectionId = this.store.auth.workspaceConnectionIds[0] || undefined;
      if (!workspaceId || !workspaceConnectionId) return;

      const response = await this.service.fetchEntityConnections(workspaceId);

      if (response) {
        runInAction(() => {
          response.forEach((data) => {
            set(this.entityConnectionMap, [workspaceId, workspaceConnectionId, data.id], data);
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
   * @param { string } connectionId
   * @returns { Promise<TGitlabEntityConnection | undefined> }
   */
  fetchEntityConnection = async (connectionId: string): Promise<TGitlabEntityConnection | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id || undefined;
      const workspaceConnectionId = this.store.auth.workspaceConnectionIds[0] || undefined;
      if (!workspaceId || !workspaceConnectionId || !connectionId) return;

      const response = await this.service.fetchEntityConnection(connectionId);

      if (response) {
        runInAction(() => {
          set(this.entityConnectionMap, [workspaceId, workspaceConnectionId, response.id], response);
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
  createEntityConnection = async (
    entity: Partial<TGitlabEntityConnection>
  ): Promise<TGitlabEntityConnection | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id || undefined;
      const workspaceSlug = this.store.workspace?.slug || undefined;
      const workspaceConnectionId = this.store.auth.workspaceConnectionIds[0] || undefined;
      if (!workspaceId || !workspaceSlug || !workspaceConnectionId) return;

      const gitlabEntityId = entity?.entity_id || undefined;
      if (!gitlabEntityId) return;

      const gitlabEntity = this.store.data.gitlabEntityById(gitlabEntityId) || undefined;
      if (!gitlabEntity) return;

      const payload: Partial<TGitlabEntityConnection> = {
        workspace_id: workspaceId,
        workspace_slug: workspaceSlug,
        project_id: entity.project_id,
        workspace_connection_id: workspaceConnectionId,
        entity_id: entity.entity_id,
        entity_type: gitlabEntity.type,
        entity_slug: gitlabEntity.path,
        entity_data: gitlabEntity,
        config: entity.config,
      };

      const response = await this.service.createEntityConnection(workspaceId, workspaceConnectionId, payload);

      if (response) {
        runInAction(() => {
          set(this.entityConnectionMap, [workspaceId, workspaceConnectionId, response.id], response);
        });
      }

      await this.fetchEntityConnections();

      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description create entity connection v2 with entity type and type from entity
   * @param { Partial<TGitlabEntityConnection> } entity
   * @returns { Promise<TGitlabEntityConnection | undefined> }
   */
  createEntityConnectionV2 = async (
    entity: Partial<TGitlabEntityConnection>
  ): Promise<TGitlabEntityConnection | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id || undefined;
      const workspaceSlug = this.store.workspace?.slug || undefined;
      const workspaceConnectionId = this.store.auth.workspaceConnectionIds[0] || undefined;
      if (!workspaceId || !workspaceSlug || !workspaceConnectionId) return;

      const gitlabEntityId = entity?.entity_id || undefined;
      if (!gitlabEntityId) return;

      const gitlabEntity = this.store.data.gitlabEntityById(gitlabEntityId) || undefined;
      if (!gitlabEntity) return;

      const payload: Partial<TGitlabEntityConnection> = {
        workspace_id: workspaceId,
        workspace_slug: workspaceSlug,
        project_id: entity.project_id,
        workspace_connection_id: workspaceConnectionId,
        entity_id: entity.entity_id,
        entity_type: entity.entity_type,
        entity_slug: gitlabEntity.path,
        entity_data: gitlabEntity,
        config: entity.config,
        type: entity.type,
      };

      const response = await this.service.createEntityConnectionV2(workspaceId, workspaceConnectionId, payload);

      if (response) {
        runInAction(() => {
          set(this.entityConnectionMap, [workspaceId, workspaceConnectionId, response.id], response);
        });
      }

      await this.fetchEntityConnections();

      return response;
    } catch (error) {
      throw error;
    }
  };

  createProjectConnection = async (
    entity: Partial<TGitlabEntityConnection>
  ): Promise<TGitlabEntityConnection | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id || undefined;
      const workspaceSlug = this.store.workspace?.slug || undefined;
      const workspaceConnectionId = this.store.auth.workspaceConnectionIds[0] || undefined;
      if (!workspaceId || !workspaceSlug || !workspaceConnectionId) return;

      const payload: Partial<TGitlabEntityConnection> = {
        workspace_id: workspaceId,
        workspace_slug: workspaceSlug,
        project_id: entity.project_id,
        workspace_connection_id: workspaceConnectionId,
        config: entity.config,
      };

      const response = await this.service.createProjectEntityConnection(workspaceId, workspaceConnectionId, payload);

      if (response) {
        runInAction(() => {
          set(this.entityConnectionMap, [workspaceId, workspaceConnectionId, response.id], response);
        });
      }

      await this.fetchEntityConnections();

      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description update entity
   * @param { string } connectionId
   * @param { Partial<TGitlabEntityConnection> } entity
   * @returns { Promise<TGitlabEntityConnection | undefined> }
   */
  updateEntityConnection = async (
    connectionId: string,
    entity: Partial<TGitlabEntityConnection>
  ): Promise<TGitlabEntityConnection | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id || undefined;
      const workspaceSlug = this.store.workspace?.slug || undefined;
      const workspaceConnectionId = this.store.auth.workspaceConnectionIds[0] || undefined;
      if (!workspaceId || !workspaceSlug || !workspaceConnectionId || !connectionId) return;

      const gitlabEntity = entity.entity_id ? this.store.data.gitlabEntityById(entity.entity_id) : undefined;

      const payload: Partial<TGitlabEntityConnection> = {
        workspace_id: workspaceId,
        workspace_slug: workspaceSlug,
        project_id: entity.project_id,
        workspace_connection_id: workspaceConnectionId,
        entity_id: entity.entity_id,
        entity_slug: entity.entity_slug,
        entity_type: entity.entity_type,
        entity_data: gitlabEntity,
        config: entity.config,
      };

      const response = await this.service.updateEntityConnection(
        workspaceId,
        workspaceConnectionId,
        connectionId,
        payload
      );

      if (response) {
        runInAction(() => {
          set(this.entityConnectionMap, [workspaceId, workspaceConnectionId, response.id], response);
        });
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description delete entity
   * @param { string } connectionId
   * @returns { Promise<void | undefined> }
   */
  deleteEntityConnection = async (connectionId: string): Promise<void | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id || undefined;
      const workspaceConnectionId = this.store.auth.workspaceConnectionIds[0] || undefined;
      if (!workspaceId || !workspaceConnectionId || !connectionId) return;

      await this.service.deleteEntityConnection(connectionId);
      unset(this.entityConnectionMap, [workspaceId, workspaceConnectionId, connectionId]);

      return;
    } catch (error) {
      throw error;
    }
  };
}
