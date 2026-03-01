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

import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import type { ScriptFunction, ScriptFunctionFilters, ScriptFunctionFormData } from "@plane/types";
// services
import { FunctionsService } from "@/services/runners/functions.service";
import type { CoreRootStore } from "../root.store";

export interface IFunctionsStore {
  // observables
  functionIds: Map<string, string[]>; // workspaceSlug => functionIds
  functionMap: Map<string, ScriptFunction>;
  isLoading: boolean;
  error: string | null;
  // computed
  getFunctionsByWorkspaceSlug: (workspaceSlug: string) => ScriptFunction[];
  getSystemFunctions: (workspaceSlug: string) => ScriptFunction[];
  getWorkspaceFunctions: (workspaceSlug: string) => ScriptFunction[];
  getFunctionById: (functionId: string) => ScriptFunction | undefined;
  getFunctionsByCategory: (workspaceSlug: string, category: string) => ScriptFunction[];
  // actions
  fetchFunctions: (workspaceSlug: string, filters?: ScriptFunctionFilters) => Promise<ScriptFunction[]>;
  fetchFunctionById: (workspaceSlug: string, functionId: string) => Promise<ScriptFunction>;
  createFunction: (workspaceSlug: string, data: ScriptFunctionFormData) => Promise<ScriptFunction>;
  updateFunction: (
    workspaceSlug: string,
    functionId: string,
    data: Partial<ScriptFunctionFormData>
  ) => Promise<ScriptFunction>;
  deleteFunction: (workspaceSlug: string, functionId: string) => Promise<void>;
}

export class FunctionsStore implements IFunctionsStore {
  // observables
  functionIds: Map<string, string[]> = new Map();
  functionMap: Map<string, ScriptFunction> = new Map();
  isLoading: boolean = false;
  error: string | null = null;
  // root store
  rootStore: CoreRootStore;
  // services
  functionsService: FunctionsService;

  constructor(store: CoreRootStore) {
    makeObservable(this, {
      // observables
      functionIds: observable,
      functionMap: observable,
      isLoading: observable,
      error: observable,
      // actions
      fetchFunctions: action,
      fetchFunctionById: action,
      createFunction: action,
      updateFunction: action,
      deleteFunction: action,
    });

    this.rootStore = store;
    this.functionsService = new FunctionsService();
  }

  // computed
  getFunctionsByWorkspaceSlug = computedFn((workspaceSlug: string) => {
    const workspaceFunctions = this.functionIds.get(workspaceSlug) ?? [];
    const result: ScriptFunction[] = [];
    for (const functionId of workspaceFunctions) {
      const fn = this.functionMap.get(functionId);
      if (fn) result.push(fn);
    }
    return result;
  });

  getSystemFunctions = computedFn((workspaceSlug: string) => {
    return this.getFunctionsByWorkspaceSlug(workspaceSlug).filter((fn) => fn.is_system);
  });

  getWorkspaceFunctions = computedFn((workspaceSlug: string) => {
    return this.getFunctionsByWorkspaceSlug(workspaceSlug).filter((fn) => !fn.is_system);
  });

  getFunctionById = computedFn((functionId: string) => {
    const fn = this.functionMap.get(functionId);
    if (!fn) return undefined;
    return fn;
  });

  getFunctionsByCategory = computedFn((workspaceSlug: string, category: string) => {
    return this.getFunctionsByWorkspaceSlug(workspaceSlug).filter((fn) => fn.category === category);
  });

  // actions
  fetchFunctions = async (workspaceSlug: string, filters?: ScriptFunctionFilters): Promise<ScriptFunction[]> => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const functions = await this.functionsService.list(workspaceSlug, filters);

      runInAction(() => {
        // Reset function IDs for this workspace
        this.functionIds.set(workspaceSlug, []);

        functions.forEach((fn) => {
          const existingFunction = this.functionMap.get(fn.id);
          this.functionMap.set(fn.id, { ...fn, ...(existingFunction ?? {}) });
          this.functionIds.get(workspaceSlug)?.push(fn.id);
        });
        this.isLoading = false;
      });

      return functions;
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
        this.error = "Failed to fetch functions";
      });
      throw error;
    }
  };

  fetchFunctionById = async (workspaceSlug: string, functionId: string): Promise<ScriptFunction> => {
    try {
      const fn = await this.functionsService.retrieve(workspaceSlug, functionId);

      runInAction(() => {
        this.functionMap.set(functionId, fn);
        if (!this.functionIds.get(workspaceSlug)?.includes(functionId)) {
          this.functionIds.set(workspaceSlug, [...(this.functionIds.get(workspaceSlug) ?? []), functionId]);
        }
      });

      return fn;
    } catch (error) {
      console.error("Failed to fetch function:", error);
      throw error;
    }
  };

  createFunction = async (workspaceSlug: string, data: ScriptFunctionFormData): Promise<ScriptFunction> => {
    try {
      const fn = await this.functionsService.create(workspaceSlug, data);

      runInAction(() => {
        this.functionMap.set(fn.id, fn);
        this.functionIds.set(workspaceSlug, [fn.id, ...(this.functionIds.get(workspaceSlug) ?? [])]);
      });

      return fn;
    } catch (error) {
      console.error("Failed to create function:", error);
      throw error;
    }
  };

  updateFunction = async (
    workspaceSlug: string,
    functionId: string,
    data: Partial<ScriptFunctionFormData>
  ): Promise<ScriptFunction> => {
    try {
      const fn = await this.functionsService.update(workspaceSlug, functionId, data);

      runInAction(() => {
        this.functionMap.set(functionId, fn);
      });

      return fn;
    } catch (error) {
      console.error("Failed to update function:", error);
      throw error;
    }
  };

  deleteFunction = async (workspaceSlug: string, functionId: string): Promise<void> => {
    try {
      await this.functionsService.destroy(workspaceSlug, functionId);

      runInAction(() => {
        this.functionMap.delete(functionId);
        this.functionIds.set(
          workspaceSlug,
          (this.functionIds.get(workspaceSlug) ?? []).filter((id) => id !== functionId)
        );
      });
    } catch (error) {
      console.error("Failed to delete function:", error);
      throw error;
    }
  };
}
