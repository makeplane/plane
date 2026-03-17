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

import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { IWorkItemRelationDefinition, TWorkItemRelationDefinitionPayload, TLoader } from "@plane/types";
import { WorkItemRelationDefinitionService } from "@plane/services";

export interface IRelationDefinitionStore {
  // observables
  loader: TLoader;
  relationDefinitionMap: Record<string, IWorkItemRelationDefinition>;
  // computed
  sortedRelationDefinitions: IWorkItemRelationDefinition[];
  // computed fn
  getById: (id: string) => IWorkItemRelationDefinition | undefined;
  // actions
  fetchRelationDefinitions: (
    workspaceSlug: string,
    params?: Record<string, string>
  ) => Promise<IWorkItemRelationDefinition[]>;
  createRelationDefinition: (
    workspaceSlug: string,
    data: TWorkItemRelationDefinitionPayload
  ) => Promise<IWorkItemRelationDefinition>;
  updateRelationDefinition: (
    workspaceSlug: string,
    id: string,
    data: TWorkItemRelationDefinitionPayload
  ) => Promise<IWorkItemRelationDefinition>;
  deleteRelationDefinition: (workspaceSlug: string, id: string) => Promise<void>;
}

export class RelationDefinitionStore implements IRelationDefinitionStore {
  // observables
  loader: TLoader = undefined;
  relationDefinitionMap: Record<string, IWorkItemRelationDefinition> = {};
  // service
  private service: WorkItemRelationDefinitionService;

  constructor() {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      relationDefinitionMap: observable,
      // computed
      sortedRelationDefinitions: computed,
      // actions
      fetchRelationDefinitions: action,
      createRelationDefinition: action,
      updateRelationDefinition: action,
      deleteRelationDefinition: action,
    });
    this.service = new WorkItemRelationDefinitionService();
  }

  // computed
  get sortedRelationDefinitions(): IWorkItemRelationDefinition[] {
    return Object.values(this.relationDefinitionMap).sort((a, b) => a.sort_order - b.sort_order);
  }

  // computed fn
  getById = computedFn((id: string): IWorkItemRelationDefinition | undefined => this.relationDefinitionMap[id]);

  // actions
  fetchRelationDefinitions = async (
    workspaceSlug: string,
    params?: Record<string, string>
  ): Promise<IWorkItemRelationDefinition[]> => {
    try {
      this.loader = "init-loader";
      const definitions = await this.service.list(workspaceSlug, params);
      runInAction(() => {
        this.relationDefinitionMap = {};
        for (const def of definitions) {
          this.relationDefinitionMap[def.id] = def;
        }
        this.loader = "loaded";
      });
      return definitions;
    } catch (error) {
      runInAction(() => {
        this.loader = "loaded";
      });
      throw error;
    }
  };

  createRelationDefinition = async (
    workspaceSlug: string,
    data: TWorkItemRelationDefinitionPayload
  ): Promise<IWorkItemRelationDefinition> => {
    const definition = await this.service.create(workspaceSlug, data);
    runInAction(() => {
      this.relationDefinitionMap[definition.id] = definition;
    });
    return definition;
  };

  updateRelationDefinition = async (
    workspaceSlug: string,
    id: string,
    data: TWorkItemRelationDefinitionPayload
  ): Promise<IWorkItemRelationDefinition> => {
    // optimistic update
    const original = this.relationDefinitionMap[id];
    runInAction(() => {
      this.relationDefinitionMap[id] = { ...original, ...data } as IWorkItemRelationDefinition;
    });
    try {
      const updated = await this.service.update(workspaceSlug, id, data);
      runInAction(() => {
        this.relationDefinitionMap[id] = updated;
      });
      return updated;
    } catch (error) {
      // rollback
      runInAction(() => {
        if (original) this.relationDefinitionMap[id] = original;
      });
      throw error;
    }
  };

  deleteRelationDefinition = async (workspaceSlug: string, id: string): Promise<void> => {
    const original = this.relationDefinitionMap[id];
    runInAction(() => {
      delete this.relationDefinitionMap[id];
    });
    try {
      await this.service.destroy(workspaceSlug, id);
    } catch (error) {
      // rollback
      runInAction(() => {
        if (original) this.relationDefinitionMap[id] = original;
      });
      throw error;
    }
  };
}
