/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { orderBy, set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane imports
import type { THomeWidgetKeys, TWidgetEntityData } from "@plane/types";
// plane web services
import { WorkspaceService } from "@/services/workspace.service";
// store
import type { IWorkspaceLinkStore } from "./link.store";
import { WorkspaceLinkStore } from "./link.store";

export interface IHomeStore {
  // observables
  loading: boolean;
  showWidgetSettings: boolean;
  widgetsMap: Record<string, TWidgetEntityData>;
  widgets: THomeWidgetKeys[];
  // computed
  isAnyWidgetEnabled: boolean;
  orderedWidgets: THomeWidgetKeys[];
  //stores
  quickLinks: IWorkspaceLinkStore;
  // actions
  toggleWidgetSettings: (value?: boolean) => void;
  fetchWidgets: (workspaceSlug: string) => Promise<void>;
  reorderWidget: (
    workspaceSlug: string,
    widgetKey: string,
    destinationId: string,
    edge: string | undefined
  ) => Promise<void>;
  toggleWidget: (workspaceSlug: string, widgetKey: string, is_enabled: boolean) => void;
}

export class HomeStore implements IHomeStore {
  // observables
  showWidgetSettings = false;
  loading = false;
  widgetsMap: Record<string, TWidgetEntityData> = {};
  widgets: THomeWidgetKeys[] = [];
  // stores
  quickLinks: IWorkspaceLinkStore;
  // services
  workspaceService: WorkspaceService;
  // in-flight reorder bookkeeping per widget (not observable)
  private widgetReorderState: Record<
    string,
    { latestRequestId: number; pendingRequests: number; savedRequestId: number; savedSortOrder: number | undefined }
  > = {};

  constructor() {
    makeObservable(this, {
      // observables
      loading: observable,
      showWidgetSettings: observable,
      widgetsMap: observable,
      widgets: observable,
      // computed
      isAnyWidgetEnabled: computed,
      orderedWidgets: computed,
      // actions
      toggleWidgetSettings: action,
      fetchWidgets: action,
      reorderWidget: action,
      toggleWidget: action,
    });
    // services
    this.workspaceService = new WorkspaceService();

    // stores
    this.quickLinks = new WorkspaceLinkStore();
  }

  get isAnyWidgetEnabled() {
    return Object.values(this.widgetsMap).some((widget) => widget.is_enabled);
  }

  get orderedWidgets() {
    return orderBy(Object.values(this.widgetsMap), "sort_order", "desc").map((widget) => widget.key);
  }

  toggleWidgetSettings = (value?: boolean) => {
    this.showWidgetSettings = value !== undefined ? value : !this.showWidgetSettings;
  };

  fetchWidgets = async (workspaceSlug: string) => {
    try {
      this.loading = true;
      const widgets = await this.workspaceService.fetchWorkspaceWidgets(workspaceSlug);
      runInAction(() => {
        this.widgets = orderBy(Object.values(widgets), "sort_order", "desc").map((widget) => widget.key);
        widgets.forEach((widget) => {
          this.widgetsMap[widget.key] = widget;
        });
        this.loading = false;
      });
    } catch (error) {
      console.error("Failed to fetch widgets");
      this.loading = false;
      throw error;
    }
  };

  toggleWidget = async (workspaceSlug: string, widgetKey: string, is_enabled: boolean) => {
    try {
      await this.workspaceService.updateWorkspaceWidget(workspaceSlug, widgetKey, {
        is_enabled,
      });
      runInAction(() => {
        this.widgetsMap[widgetKey].is_enabled = is_enabled;
      });
    } catch (error) {
      console.error("Failed to toggle widget");
      throw error;
    }
  };

  reorderWidget = async (workspaceSlug: string, widgetKey: string, destinationId: string, edge: string | undefined) => {
    // moves of the same widget can overlap, so track which request is the newest and what the server last accepted
    const reorderState = (this.widgetReorderState[widgetKey] ??= {
      latestRequestId: 0,
      pendingRequests: 0,
      savedRequestId: 0,
      savedSortOrder: undefined,
    });
    if (reorderState.pendingRequests === 0) reorderState.savedSortOrder = this.widgetsMap[widgetKey]?.sort_order;
    const requestId = ++reorderState.latestRequestId;
    reorderState.pendingRequests++;
    try {
      let resultSequence = 10000;
      if (edge) {
        const sortedIds = orderBy(Object.values(this.widgetsMap), "sort_order", "desc").map((widget) => widget.key);
        const destinationSequence = this.widgetsMap[destinationId]?.sort_order || undefined;
        if (destinationSequence) {
          const destinationIndex = sortedIds.findIndex((id) => id === destinationId);
          if (edge === "reorder-above") {
            const prevSequence = this.widgetsMap[sortedIds[destinationIndex - 1]]?.sort_order || undefined;
            if (prevSequence) {
              resultSequence = (destinationSequence + prevSequence) / 2;
            } else {
              resultSequence = destinationSequence + resultSequence;
            }
          } else {
            resultSequence = destinationSequence - resultSequence;
          }
        }
      }
      runInAction(() => {
        set(this.widgetsMap, [widgetKey, "sort_order"], resultSequence);
      });
      await this.workspaceService.updateWorkspaceWidget(workspaceSlug, widgetKey, {
        sort_order: resultSequence,
      });
      if (requestId > reorderState.savedRequestId) {
        reorderState.savedRequestId = requestId;
        reorderState.savedSortOrder = resultSequence;
      }
    } catch (error) {
      console.error("Failed to move widget");
      // only the newest move may roll back, and it rolls back to the last saved order rather than a stale snapshot
      if (requestId === reorderState.latestRequestId) {
        runInAction(() => {
          set(this.widgetsMap, [widgetKey, "sort_order"], reorderState.savedSortOrder);
        });
      }
      throw error;
    } finally {
      reorderState.pendingRequests--;
    }
  };
}
