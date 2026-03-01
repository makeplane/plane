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
// plane imports
// plane web imports
import type { RootStore } from "@/plane-web/store/root.store";
import type { TAgentRun, TAgentRunActivity } from "@plane/types";
import { EAgentRunStatus } from "@plane/types";
import { computedFn } from "mobx-utils";
import { WorkspaceService } from "@/services/workspace.service";
import { AgentRunService } from "@/services/agent.service";

type TActivityPaginationInfo = {
  nextCursor: string | null;
  prevCursor: string | null;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalCount: number;
};

type TActivityLoader = "init-loader" | "pagination" | "loaded" | undefined;

export interface IAgentStore {
  activeRunId: string;
  activeRun: TAgentRun;
  runMap: Record<string, TAgentRun>; // run_id -> run
  agentService: AgentRunService;
  activitiesLoader: TActivityLoader;
  // computed fn
  activeRunActivities: TAgentRunActivity[];
  activeRunPaginationInfo: TActivityPaginationInfo | undefined;
  getRunStatusById: (runId: string) => EAgentRunStatus | undefined;
  // actions
  initRun: (data: TAgentRun) => void;
  fetchRunById: (runId: string, workspaceSlug: string) => Promise<void>;
  fetchRunActivities: (workspaceSlug: string, runId: string) => Promise<void>;
  fetchNextRunActivities: (workspaceSlug: string, runId: string) => Promise<void>;
}

export class AgentStore implements IAgentStore {
  activeRunId = "";
  runMap: Record<string, TAgentRun> = {};
  runActivityMap: Record<string, TAgentRunActivity[]> = {};
  runActivityPaginationMap: Record<string, TActivityPaginationInfo> = {};
  activitiesLoader: TActivityLoader = undefined;
  //services
  userStore;
  rootStore;
  agentService;
  workspaceService;
  // store

  constructor(public store: RootStore) {
    makeObservable(this, {
      //observables
      activeRunId: observable,
      runMap: observable,
      runActivityMap: observable,
      runActivityPaginationMap: observable,
      activitiesLoader: observable,
      // computed
      activeRun: computed,
      activeRunActivities: computed,
      activeRunPaginationInfo: computed,
      // actions
      initRun: action,
      fetchRunById: action,
      fetchRunActivities: action,
      fetchNextRunActivities: action,
    });

    //services
    this.rootStore = store;
    this.userStore = store.user;
    this.workspaceService = new WorkspaceService();
    this.agentService = new AgentRunService();
  }

  get activeRun() {
    return this.runMap[this.activeRunId];
  }

  get activeRunActivities() {
    return this.runActivityMap[this.activeRunId] ?? [];
  }

  get activeRunPaginationInfo() {
    return this.runActivityPaginationMap[this.activeRunId];
  }

  getRunStatusById = computedFn((runId: string) => {
    return this.runMap[runId]?.status;
  });

  // actions
  initRun = (data: TAgentRun) => {
    this.activeRunId = data.id;
    this.runMap[data.id] = data;
    this.activitiesLoader = "init-loader";
  };

  fetchRunById = async (runId: string, workspaceSlug: string) => {
    try {
      const _response = await this.agentService.getAgentRun(workspaceSlug, runId);
      this.initRun(_response);
      // TODO: handle response
    } catch (e: unknown) {
      console.error(e);
    }
  };

  fetchRunActivities = async (workspaceSlug: string, runId: string) => {
    try {
      // Set loader
      runInAction(() => {
        const currentActivities = this.runActivityMap[runId];
        this.activitiesLoader = currentActivities && currentActivities.length > 0 ? "loaded" : "init-loader";
      });

      const response = await this.agentService.getAgentRunActivities(workspaceSlug, runId);

      runInAction(() => {
        this.runMap[runId] = {
          ...this.runMap[runId],
          status: response.agent_run_status,
        };
        const existingActivities = this.runActivityMap[runId] ?? [];
        const existingIds = new Set(existingActivities.map((a) => a.id));

        // Merge new results with existing data:
        // 1. Update existing activities in place
        // 2. Prepend new activities that don't exist yet
        // 3. Keep paginated activities intact
        const newActivities = response.results.filter((a) => !existingIds.has(a.id));
        const updatedExisting = existingActivities.map((existing) => {
          const updated = response.results.find((r) => r.id === existing.id);
          return updated ?? existing;
        });

        this.runActivityMap[runId] = [...newActivities, ...updatedExisting];

        // Only update pagination info if this is the initial load (no existing activities)
        if (existingActivities.length === 0) {
          this.runActivityPaginationMap[runId] = {
            nextCursor: response.next_cursor,
            prevCursor: response.prev_cursor,
            hasNextPage: response.next_page_results,
            hasPrevPage: response.prev_page_results,
            totalCount: response.total_count,
          };
        } else {
          // Update total count to reflect new items
          const currentPagination = this.runActivityPaginationMap[runId];
          if (currentPagination) {
            this.runActivityPaginationMap[runId] = {
              ...currentPagination,
              totalCount: response.total_count,
            };
          }
        }
        this.activitiesLoader = "loaded";
      });
    } catch (e: unknown) {
      runInAction(() => {
        this.activitiesLoader = undefined;
      });
      console.error(e);
    }
  };

  fetchNextRunActivities = async (workspaceSlug: string, runId: string) => {
    const paginationInfo = this.runActivityPaginationMap[runId];

    // Don't fetch if there's no next page or already loading
    if (!paginationInfo?.hasNextPage || !paginationInfo?.nextCursor) return;
    if (this.activitiesLoader === "pagination") return;

    try {
      runInAction(() => {
        this.activitiesLoader = "pagination";
      });

      const response = await this.agentService.getAgentRunActivities(workspaceSlug, runId, paginationInfo.nextCursor);

      runInAction(() => {
        // Append new activities to existing ones
        const existingActivities = this.runActivityMap[runId] ?? [];
        this.runActivityMap[runId] = [...existingActivities, ...response.results];
        // Update pagination info
        this.runActivityPaginationMap[runId] = {
          nextCursor: response.next_cursor,
          prevCursor: response.prev_cursor,
          hasNextPage: response.next_page_results,
          hasPrevPage: response.prev_page_results,
          totalCount: response.total_count,
        };
        this.activitiesLoader = "loaded";
      });
    } catch (e: unknown) {
      runInAction(() => {
        this.activitiesLoader = "loaded";
      });
      console.error(e);
    }
  };
}
