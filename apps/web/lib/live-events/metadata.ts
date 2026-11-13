/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * refreshes a project's cycle and module definitions after a live metadata event (a cycle or module
 * created, renamed, re-dated, archived, restored or deleted elsewhere), which arrives as a full refresh.
 *
 * The stores' own fetchAllCycles / fetchModules set their loader (the cycle and module pages would flash) and
 * only upsert, so a deleted or archived definition would stay. This reads the same list endpoints quietly,
 * upserts the answer, and drops this project's non-archived entries the server no longer returns (deleted,
 * or archived: the archive pages load their own lists). Archived entries are left alone.
 */

import { runInAction } from "mobx";
// services
import { CycleService } from "@/services/cycle.service";
import { ModuleService } from "@/services/module.service";
// types
import type { ICycleStore } from "@/store/cycle.store";
import type { IModuleStore } from "@/store/module.store";
import type { IProjectEstimateStore } from "@/store/estimates/project-estimate.store";

const cycleService = new CycleService();
const moduleService = new ModuleService();

export const refreshCycleAndModuleDefinitions = async (
  stores: { cycle: ICycleStore; module: IModuleStore },
  workspaceSlug: string,
  projectId: string
) => {
  const [cycles, modules] = await Promise.all([
    cycleService.getCyclesWithParams(workspaceSlug, projectId),
    moduleService.getModules(workspaceSlug, projectId),
  ]);
  runInAction(() => {
    const { cycleMap, activeCycleIdMap } = stores.cycle;
    const cycleIds = new Set(cycles.map((cycle) => cycle.id));
    for (const [id, cycle] of Object.entries(cycleMap)) {
      if (cycle.project_id === projectId && !cycle.archived_at && !cycleIds.has(id)) {
        delete cycleMap[id];
        delete activeCycleIdMap[id];
      }
    }
    for (const cycle of cycles) {
      cycleMap[cycle.id] = cycle;
      if (cycle.status?.toLowerCase() === "current") activeCycleIdMap[cycle.id] = true;
      else delete activeCycleIdMap[cycle.id];
    }

    const { moduleMap } = stores.module;
    const moduleIds = new Set(modules.map((module) => module.id));
    for (const [id, module] of Object.entries(moduleMap)) {
      if (module.project_id === projectId && !module.archived_at && !moduleIds.has(id)) delete moduleMap[id];
    }
    for (const module of modules) moduleMap[module.id] = { ...moduleMap[module.id], ...module };
  });
};

/**
 * refreshes a project's estimate definitions (the estimate and its points) after a live metadata
 * event. getProjectEstimates sets its loader only on a project's first load, so a refresh does not flash; it
 * only upserts, so this project's estimates the server no longer returns (deleted) are dropped here.
 */
export const refreshEstimateDefinitions = async (
  stores: { projectEstimate: IProjectEstimateStore },
  workspaceSlug: string,
  projectId: string
) => {
  const store = stores.projectEstimate;
  const estimates = await store.getProjectEstimates(workspaceSlug, projectId, "mutation-loader");
  runInAction(() => {
    const ids = new Set((estimates ?? []).map((estimate) => estimate.id));
    for (const id of store.estimateIdsByProjectId(projectId) ?? []) if (!ids.has(id)) delete store.estimates[id];
  });
};
