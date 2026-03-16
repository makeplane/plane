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
import type { RunnerScript, TRunnerScriptExecution, TRunnerScriptFilters, TRunnerScriptStats } from "@plane/types";
// plane web store
// services
import { RunnerCtlService } from "@/services/runners/runnerctl.service";
import type { CoreRootStore } from "../root.store";

export interface IRunnersStore {
  // observables
  scriptIds: Map<string, string[]>; // workspaceSlug => scriptIds
  scriptMap: Map<string, RunnerScript>;
  executionMap: Map<string, TRunnerScriptExecution[]>; // scriptId => executions
  stats: TRunnerScriptStats | null;
  isLoading: boolean;
  error: string | null;
  runnerAvailability: Map<string, boolean>; // workspaceSlug => isAvailable
  // computed
  getScriptsByWorkspaceSlug: (workspaceSlug: string) => RunnerScript[];
  getScriptById: (scriptId: string) => RunnerScript | undefined;
  getExecutionsByScriptId: (scriptId: string) => TRunnerScriptExecution[];
  isRunnerAvailable: (workspaceSlug: string) => boolean;
  // actions
  fetchScripts: (workspaceSlug: string, filters?: TRunnerScriptFilters) => Promise<RunnerScript[]>;
  fetchScriptById: (workspaceSlug: string, scriptId: string) => Promise<RunnerScript>;
  createScript: (workspaceSlug: string, data: Partial<RunnerScript>) => Promise<RunnerScript>;
  updateScript: (workspaceSlug: string, scriptId: string, data: Partial<RunnerScript>) => Promise<RunnerScript>;
  deleteScript: (workspaceSlug: string, scriptId: string) => Promise<void>;
  fetchStats: (workspaceSlug: string) => Promise<TRunnerScriptStats>;
  checkRunnerHealth: (workspaceSlug: string) => Promise<boolean>;
}

export class RunnersStore implements IRunnersStore {
  // observables
  scriptIds: Map<string, string[]> = new Map();
  scriptMap: Map<string, RunnerScript> = new Map();
  executionMap: Map<string, TRunnerScriptExecution[]> = new Map();
  stats: TRunnerScriptStats | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  runnerAvailability: Map<string, boolean> = new Map();
  // root store
  rootStore: CoreRootStore;
  // services
  runnerCtlService: RunnerCtlService;

  constructor(store: CoreRootStore) {
    makeObservable(this, {
      // observables
      scriptIds: observable,
      scriptMap: observable,
      executionMap: observable,
      stats: observable,
      isLoading: observable,
      error: observable,
      runnerAvailability: observable,
      // actions
      fetchScripts: action,
      fetchScriptById: action,
      createScript: action,
      updateScript: action,
      deleteScript: action,
      fetchStats: action,
      checkRunnerHealth: action,
    });

    this.rootStore = store;
    this.runnerCtlService = new RunnerCtlService();
  }

  // computed
  getScriptsByWorkspaceSlug = computedFn((workspaceSlug: string) => {
    const workspaceScripts = this.scriptIds.get(workspaceSlug) ?? [];
    const result: RunnerScript[] = [];
    for (const scriptId of workspaceScripts) {
      const script = this.scriptMap.get(scriptId);
      if (script) result.push(script);
    }
    return result;
  });

  getScriptById = computedFn((scriptId: string) => {
    return this.scriptMap.get(scriptId) ?? undefined;
  });

  getExecutionsByScriptId = computedFn((scriptId: string) => {
    return this.executionMap.get(scriptId) ?? [];
  });

  isRunnerAvailable = computedFn((workspaceSlug: string) => {
    return this.runnerAvailability.get(workspaceSlug) ?? false;
  });

  // actions
  checkRunnerHealth = async (workspaceSlug: string): Promise<boolean> => {
    try {
      const result = await this.runnerCtlService.checkHealth(workspaceSlug);
      const isAvailable = result.is_available === true;

      runInAction(() => {
        this.runnerAvailability.set(workspaceSlug, isAvailable);
      });

      return isAvailable;
    } catch {
      runInAction(() => {
        this.runnerAvailability.set(workspaceSlug, false);
      });
      return false;
    }
  };
  fetchScripts = async (workspaceSlug: string, filters?: TRunnerScriptFilters): Promise<RunnerScript[]> => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const scripts = await this.runnerCtlService.list(workspaceSlug, filters);
      runInAction(() => {
        this.scriptIds = new Map();
        scripts.forEach((script) => {
          const existingScript = this.scriptMap.get(script.id);
          this.scriptMap.set(script.id, { ...script, ...(existingScript ?? {}) });
          this.scriptIds.set(workspaceSlug, [...(this.scriptIds.get(workspaceSlug) ?? []), script.id]);
        });
        this.isLoading = false;
      });

      return scripts;
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
        this.error = "Failed to fetch scripts";
      });
      throw error;
    }
  };

  fetchScriptById = async (workspaceSlug: string, scriptId: string): Promise<RunnerScript> => {
    try {
      const script = await this.runnerCtlService.retrieve(workspaceSlug, scriptId);

      runInAction(() => {
        this.scriptMap.set(scriptId, script);
        if (!this.scriptIds.get(workspaceSlug)?.includes(scriptId)) {
          this.scriptIds.set(workspaceSlug, [...(this.scriptIds.get(workspaceSlug) ?? []), scriptId]);
        }
      });

      return script;
    } catch (error) {
      console.error("Failed to fetch script:", error);
      throw error;
    }
  };

  createScript = async (workspaceSlug: string, data: Partial<RunnerScript>): Promise<RunnerScript> => {
    try {
      const script = await this.runnerCtlService.create(workspaceSlug, data);

      runInAction(() => {
        this.scriptMap.set(script.id, script);
        this.scriptIds.set(workspaceSlug, [...(this.scriptIds.get(workspaceSlug) ?? []), script.id]);
      });

      return script;
    } catch (error) {
      console.error("Failed to create script:", error);
      throw error;
    }
  };

  updateScript = async (
    workspaceSlug: string,
    scriptId: string,
    data: Partial<RunnerScript>
  ): Promise<RunnerScript> => {
    try {
      const script = await this.runnerCtlService.update(workspaceSlug, scriptId, data);

      runInAction(() => {
        this.scriptMap.set(scriptId, script);
      });

      return script;
    } catch (error) {
      console.error("Failed to update script:", error);
      throw error;
    }
  };

  deleteScript = async (workspaceSlug: string, scriptId: string): Promise<void> => {
    try {
      await this.runnerCtlService.destroy(workspaceSlug, scriptId);

      runInAction(() => {
        this.scriptMap.delete(scriptId);
        this.scriptIds.set(
          workspaceSlug,
          (this.scriptIds.get(workspaceSlug) ?? []).filter((id) => id !== scriptId)
        );
        this.executionMap.delete(scriptId);
      });
    } catch (error) {
      console.error("Failed to delete script:", error);
      throw error;
    }
  };

  fetchStats = async (workspaceSlug: string): Promise<TRunnerScriptStats> => {
    try {
      const stats = await this.runnerCtlService.listStats(workspaceSlug);

      runInAction(() => {
        this.stats = stats;
      });

      return stats;
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      throw error;
    }
  };
}
