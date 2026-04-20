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
import { DEFAULT_CREATE_UPDATE_MODAL_CONFIG } from "@plane/constants";
import { WorkspaceAutomationsService } from "@plane/services";
import type {
  EAutomationNodeType,
  TAutomation,
  TAutomationDetails,
  TAutomationNodeEdge,
  TAutomationNode,
  TAutomationNodeConfig,
  TAutomationNodeHandlerName,
  TLoader,
  TCreateUpdateModalConfig,
} from "@plane/types";
// plane web store
import type { RootStore } from "@/plane-web/store/root.store";
// local imports
import type { IAutomationInstance, TAutomationHelpers } from "./automation";
import type { TAutomationBaseNodeHelpers } from "./node/base";
import type { AutomationsRootStore } from "./root.store";

export interface IWorkspaceAutomationsStore {
  // observables
  loaderMap: Map<string, TLoader>; // workspace slug -> loader
  fetchStatusMap: Map<string, boolean>; // automation id -> fetch status (true only if automation details are fetched)
  workspaceAutomationIdsMap: Map<string, Set<string>>; // workspace slug -> automation ids
  // modal data
  createUpdateModalConfig: TCreateUpdateModalConfig;
  // helpers
  getIsInitializingAutomations: (workspaceSlug: string) => boolean;
  getFetchStatusById: (automationId: string) => boolean;
  getWorkspaceAutomationIds: (workspaceSlug: string) => string[];
  getWorkspaceAutomations: (workspaceSlug: string) => IAutomationInstance[];
  isAnyAutomationAvailableForWorkspace: (workspaceSlug: string) => boolean;
  setCreateUpdateModalConfig: (config: TCreateUpdateModalConfig) => void;
  // permissions
  getCanCreateAutomation: (workspaceSlug: string) => boolean;
  getCanViewAutomation: (workspaceSlug: string) => boolean;
  isWorkspaceAutomationsEnabled: boolean;
  // actions
  fetchAutomations: (workspaceSlug: string) => Promise<TAutomation[]>;
  fetchAutomationDetails: (workspaceSlug: string, automationId: string) => Promise<TAutomationDetails>;
  createAutomation: (workspaceSlug: string, data: Partial<TAutomation>) => Promise<IAutomationInstance>;
  deleteAutomation: (workspaceSlug: string, automationId: string) => Promise<void>;
}

export class WorkspaceAutomationsStore implements IWorkspaceAutomationsStore {
  // observables
  loaderMap: IWorkspaceAutomationsStore["loaderMap"] = new Map();
  fetchStatusMap: IWorkspaceAutomationsStore["fetchStatusMap"] = new Map();
  workspaceAutomationIdsMap: IWorkspaceAutomationsStore["workspaceAutomationIdsMap"] = new Map();
  // modal data
  createUpdateModalConfig: IWorkspaceAutomationsStore["createUpdateModalConfig"] = DEFAULT_CREATE_UPDATE_MODAL_CONFIG;
  // service
  service: WorkspaceAutomationsService;
  // root store
  automationsRoot: AutomationsRootStore;
  rootStore: RootStore;

  constructor(automationsRoot: AutomationsRootStore, rootStore: RootStore) {
    makeObservable(this, {
      // observables
      loaderMap: observable,
      fetchStatusMap: observable,
      workspaceAutomationIdsMap: observable,
      createUpdateModalConfig: observable,
      // computed
      isWorkspaceAutomationsEnabled: computed,
      // actions
      fetchAutomations: action,
      fetchAutomationDetails: action,
      createAutomation: action,
      deleteAutomation: action,
      setCreateUpdateModalConfig: action,
    });
    // initialize service
    this.service = new WorkspaceAutomationsService();
    // initialize root store
    this.automationsRoot = automationsRoot;
    this.rootStore = rootStore;
  }

  // helpers
  private _addAutomationIdToWorkspace = (
    workspaceSlug: string,
    automationId: string,
    position: "start" | "end" = "end"
  ) => {
    const currentIds = this.workspaceAutomationIdsMap.get(workspaceSlug) ?? new Set<string>();

    if (currentIds.has(automationId)) return;

    const currentIdsArray = Array.from(currentIds);
    const updatedIds =
      position === "start" ? new Set([automationId, ...currentIdsArray]) : new Set([...currentIdsArray, automationId]);

    runInAction(() => {
      this.workspaceAutomationIdsMap.set(workspaceSlug, updatedIds);
    });
  };

  private _removeAutomationIdFromWorkspace = (workspaceSlug: string, automationId: string) => {
    const currentIds = this.workspaceAutomationIdsMap.get(workspaceSlug);
    if (currentIds && currentIds.has(automationId)) {
      const updatedIds = new Set(currentIds);
      updatedIds.delete(automationId);
      this.workspaceAutomationIdsMap.set(workspaceSlug, updatedIds);
    }
  };

  private _automationActions(workspaceSlug: string, automationId: string): TAutomationHelpers["actions"] {
    return {
      update: this.service.update.bind(this.service, workspaceSlug),
      updateStatus: this.service.updateStatus.bind(this.service, workspaceSlug),
      createNode: async <T extends TAutomationNode>(payload: Partial<T>) =>
        await this.service.createNode<T>(workspaceSlug, automationId, payload),
      deleteNode: this.service.deleteNode.bind(this.service, workspaceSlug, automationId),
      createEdge: this.service.createEdge.bind(this.service, workspaceSlug, automationId),
      deleteEdge: this.service.deleteEdge.bind(this.service, workspaceSlug, automationId),
    };
  }

  private _automationNodeActions(
    workspaceSlug: string,
    automationId: string
  ): TAutomationBaseNodeHelpers<EAutomationNodeType, TAutomationNodeHandlerName, TAutomationNodeConfig>["actions"] {
    return {
      update: this.service.updateNode.bind(this.service, workspaceSlug, automationId),
    };
  }

  private _addOrUpdateAutomationNodeToStore = (workspaceSlug: string, automationId: string, node: TAutomationNode) => {
    const automationInstance = this.automationsRoot.getAutomationById(automationId);
    automationInstance?.addOrUpdateNode(node, {
      actions: this._automationNodeActions(workspaceSlug, automationId),
    });
  };

  private _addOrUpdateAutomationEdgeToStore = (automationId: string, edge: TAutomationNodeEdge) => {
    const automationInstance = this.automationsRoot.getAutomationById(automationId);
    automationInstance?.addOrUpdateEdge(edge);
  };

  private _automationActivityActions(
    workspaceSlug: string,
    automationId: string
  ): TAutomationHelpers["activityHelpers"]["actions"] {
    return {
      fetch: async (filters) => await this.service.listActivities(workspaceSlug, automationId, filters),
    };
  }

  private _addOrUpdateAutomationToStore = (
    workspaceSlug: string,
    automationId: string,
    automation: TAutomation,
    nodes: TAutomationNode[] = [],
    edges: TAutomationNodeEdge[] = [],
    addPosition: "start" | "end" = "end"
  ) => {
    // add or update automation to store
    const automationInstance = this.automationsRoot.addOrUpdateAutomation(automation, {
      actions: this._automationActions(workspaceSlug, automationId),
      can: this.rootStore.permissionAccessStore.can,
      nodeHelpers: {
        actions: this._automationNodeActions(workspaceSlug, automationId),
      },
      activityHelpers: {
        actions: this._automationActivityActions(workspaceSlug, automationId),
      },
    });
    // add or update automation nodes to store
    for (const node of nodes ?? []) {
      this._addOrUpdateAutomationNodeToStore(workspaceSlug, automationId, node);
    }
    // add or update automation edges to store
    for (const edge of edges ?? []) {
      this._addOrUpdateAutomationEdgeToStore(automationId, edge);
    }
    // update workspace automation ids map
    this._addAutomationIdToWorkspace(workspaceSlug, automationId, addPosition);
    // return automation instance
    return automationInstance;
  };

  getIsInitializingAutomations: IWorkspaceAutomationsStore["getIsInitializingAutomations"] = computedFn(
    (workspaceSlug) => this.isWorkspaceAutomationsEnabled && this.loaderMap.get(workspaceSlug) === "init-loader"
  );

  getFetchStatusById: IWorkspaceAutomationsStore["getFetchStatusById"] = computedFn(
    (automationId) => !!this.fetchStatusMap.get(automationId)
  );

  getWorkspaceAutomationIds: IWorkspaceAutomationsStore["getWorkspaceAutomationIds"] = computedFn((workspaceSlug) => {
    return Array.from(this.workspaceAutomationIdsMap.get(workspaceSlug) ?? []);
  });

  getWorkspaceAutomations: IWorkspaceAutomationsStore["getWorkspaceAutomations"] = computedFn((workspaceSlug) =>
    this.getWorkspaceAutomationIds(workspaceSlug)
      .map((id) => this.automationsRoot.getAutomationById(id))
      .filter((a) => a !== undefined)
  );

  isAnyAutomationAvailableForWorkspace: IWorkspaceAutomationsStore["isAnyAutomationAvailableForWorkspace"] = computedFn(
    (workspaceSlug) => {
      return this.isWorkspaceAutomationsEnabled && this.getWorkspaceAutomationIds(workspaceSlug).length > 0;
    }
  );

  // permissions
  getCanCreateAutomation: IWorkspaceAutomationsStore["getCanCreateAutomation"] = computedFn((workspaceSlug: string) =>
    this.rootStore.permissionAccessStore.can({
      resource: "workspace_automation",
      action: "create",
      workspaceSlug,
    })
  );

  getCanViewAutomation: IWorkspaceAutomationsStore["getCanViewAutomation"] = computedFn((workspaceSlug: string) =>
    this.rootStore.permissionAccessStore.can({
      resource: "workspace_automation",
      action: "view",
      workspaceSlug,
    })
  );

  get isWorkspaceAutomationsEnabled() {
    return this.rootStore.featureFlags.getFeatureFlagForCurrentWorkspace("WORKSPACE_AUTOMATIONS", false);
  }

  // automation crud
  fetchAutomations: IWorkspaceAutomationsStore["fetchAutomations"] = async (workspaceSlug) => {
    try {
      this.loaderMap.set(workspaceSlug, this.loaderMap.get(workspaceSlug) ?? "init-loader");
      const res = await this.service.list(workspaceSlug);
      runInAction(() => {
        for (const automation of res) {
          if (automation.id) {
            this._addOrUpdateAutomationToStore(workspaceSlug, automation.id, automation);
          }
        }
        this.loaderMap.set(workspaceSlug, "loaded");
      });
      return res;
    } catch (error) {
      console.error("Error in fetching workspace automations:", error);
      this.loaderMap.set(workspaceSlug, "loaded");
      throw error;
    }
  };

  fetchAutomationDetails: IWorkspaceAutomationsStore["fetchAutomationDetails"] = async (
    workspaceSlug,
    automationId
  ) => {
    try {
      const res = await this.service.retrieve(workspaceSlug, automationId);
      runInAction(() => {
        const { nodes, edges, ...automation } = res;
        this._addOrUpdateAutomationToStore(workspaceSlug, automationId, automation, nodes, edges);
        this.fetchStatusMap.set(automationId, true);
      });
      return res;
    } catch (error) {
      console.error("Error in fetching workspace automation details:", error);
      throw error;
    }
  };

  createAutomation: IWorkspaceAutomationsStore["createAutomation"] = async (workspaceSlug, data) => {
    try {
      this.loaderMap.set(workspaceSlug, "mutation");
      const res = await this.service.create(workspaceSlug, data);
      const resId = res.id;
      const automationInstance = runInAction(() =>
        this._addOrUpdateAutomationToStore(workspaceSlug, resId, res, undefined, undefined, "start")
      );
      this.loaderMap.set(workspaceSlug, "loaded");
      return automationInstance;
    } catch (error) {
      console.error("Error in creating workspace automation:", error);
      this.loaderMap.set(workspaceSlug, "loaded");
      throw error;
    }
  };

  deleteAutomation: IWorkspaceAutomationsStore["deleteAutomation"] = async (workspaceSlug, automationId) => {
    try {
      this.loaderMap.set(workspaceSlug, "mutation");
      await this.service.destroy(workspaceSlug, automationId);
      runInAction(() => {
        this.automationsRoot.removeAutomation(automationId);
        this._removeAutomationIdFromWorkspace(workspaceSlug, automationId);
        this.loaderMap.set(workspaceSlug, "loaded");
      });
    } catch (error) {
      console.error("Error in deleting workspace automation:", error);
      this.loaderMap.set(workspaceSlug, "loaded");
      throw error;
    }
  };

  // modal helpers
  setCreateUpdateModalConfig: IWorkspaceAutomationsStore["setCreateUpdateModalConfig"] = (config) => {
    runInAction(() => {
      this.createUpdateModalConfig = config;
    });
  };
}
