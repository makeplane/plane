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

import { EBitbucketEntityConnectionType } from "@plane/etl/bitbucket";
import { unset, set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import type { TBitbucketEntityConnection } from "@plane/types";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { BitbucketEntityService } from "@/services/integrations/bitbucket-dc";
import type { IBitbucketStore } from "./root.store";

export const E_BITBUCKET_ENTITY_CONNECTION_TYPE = {
  PROJECT_PR_AUTOMATION: EBitbucketEntityConnectionType.PROJECT_PR_AUTOMATION,
} as const;

export interface IBitbucketEntityStore {
  entityMap: Record<string, Record<string, Record<string, TBitbucketEntityConnection>>>;
  entityIds: string[];
  entityById: (entityId: string) => TBitbucketEntityConnection | undefined;
  fetchEntities: () => Promise<TBitbucketEntityConnection[] | undefined>;
  createEntity: (entity: Partial<TBitbucketEntityConnection>) => Promise<TBitbucketEntityConnection | undefined>;
  updateEntity: (
    entityId: string,
    entity: Partial<TBitbucketEntityConnection>
  ) => Promise<TBitbucketEntityConnection | undefined>;
  deleteEntity: (entityId: string) => Promise<void>;
}

export class BitbucketEntityStore implements IBitbucketEntityStore {
  entityMap: Record<string, Record<string, Record<string, TBitbucketEntityConnection>>> = {};
  private service: BitbucketEntityService;

  constructor(protected store: IBitbucketStore) {
    makeObservable(this, {
      entityMap: observable,
      entityIds: computed,
      fetchEntities: action,
      createEntity: action,
      updateEntity: action,
      deleteEntity: action,
    });

    this.service = new BitbucketEntityService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));
  }

  get entityIds(): string[] {
    const workspaceId = this.store.workspace?.id;
    const connectionId = this.store.auth.workspaceConnectionIds[0];
    if (!workspaceId || !connectionId || !this.entityMap?.[workspaceId]?.[connectionId]) return [];
    return Object.keys(this.entityMap[workspaceId][connectionId]);
  }

  entityById = computedFn((entityId: string): TBitbucketEntityConnection | undefined => {
    const workspaceId = this.store.workspace?.id;
    const connectionId = this.store.auth.workspaceConnectionIds[0];
    if (!workspaceId || !connectionId || !entityId || !this.entityMap?.[workspaceId]?.[connectionId]) return undefined;
    return this.entityMap[workspaceId][connectionId][entityId];
  });

  fetchEntities = async (): Promise<TBitbucketEntityConnection[] | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id;
      const connectionId = this.store.auth.workspaceConnectionIds[0];
      if (!workspaceId || !connectionId) return;

      const response = await this.service.fetchEntityConnections(
        workspaceId,
        connectionId,
        E_INTEGRATION_KEYS.BITBUCKET_DC
      );
      if (response) {
        runInAction(() => {
          response.forEach((data) => {
            set(this.entityMap, [workspaceId, connectionId, data.id], data);
          });
        });
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  createEntity = async (
    entity: Partial<TBitbucketEntityConnection>
  ): Promise<TBitbucketEntityConnection | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id;
      const workspaceSlug = this.store.workspace?.slug;
      const connectionId = this.store.auth.workspaceConnectionIds[0];
      if (!workspaceId || !workspaceSlug || !connectionId) return;

      let entitySlug: string | undefined;
      let entityData: TBitbucketEntityConnection["entity_data"] | undefined;

      if (entity.entity_id) {
        const repo = this.store.data.bitbucketRepositoryById(entity.entity_id);
        if (repo) {
          entitySlug = `${repo.project.key}/${repo.slug}`;
          entityData = repo;
        }
      }

      const payload: Partial<TBitbucketEntityConnection> = {
        workspace_id: workspaceId,
        workspace_slug: workspaceSlug,
        project_id: entity.project_id,
        workspace_connection_id: connectionId,
        entity_id: entity.entity_id,
        entity_type: E_INTEGRATION_KEYS.BITBUCKET_DC,
        entity_slug: entitySlug,
        entity_data: entityData,
        config: entity.config,
        type: entity.type,
      };

      const response = await this.service.createEntityConnection(workspaceId, connectionId, payload);
      if (response) {
        runInAction(() => {
          set(this.entityMap, [workspaceId, connectionId, response.id], response);
        });
      }
      await this.fetchEntities();
      return response;
    } catch (error) {
      throw error;
    }
  };

  updateEntity = async (
    entityId: string,
    entity: Partial<TBitbucketEntityConnection>
  ): Promise<TBitbucketEntityConnection | undefined> => {
    try {
      const workspaceId = this.store.workspace?.id;
      const workspaceSlug = this.store.workspace?.slug;
      const connectionId = this.store.auth.workspaceConnectionIds[0];
      if (!workspaceId || !workspaceSlug || !connectionId || !entityId) return;

      const payload: Partial<TBitbucketEntityConnection> = {
        workspace_id: workspaceId,
        workspace_slug: workspaceSlug,
        project_id: entity.project_id,
        workspace_connection_id: connectionId,
        entity_id: entity.entity_id,
        entity_slug: entity.entity_slug,
        entity_data: entity.entity_data,
        config: entity.config,
        type: entity.type,
      };

      const response = await this.service.updateEntityConnection(workspaceId, connectionId, entityId, payload);
      if (response) {
        runInAction(() => {
          set(this.entityMap, [workspaceId, connectionId, response.id], response);
        });
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  deleteEntity = async (entityId: string): Promise<void> => {
    try {
      const workspaceId = this.store.workspace?.id;
      const connectionId = this.store.auth.workspaceConnectionIds[0];
      if (!workspaceId || !connectionId || !entityId) return;

      await this.service.deleteEntityConnection(workspaceId, connectionId, entityId);
      runInAction(() => {
        unset(this.entityMap, [workspaceId, connectionId, entityId]);
      });
    } catch (error) {
      throw error;
    }
  };
}
