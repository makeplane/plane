import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { DEFAULT_CREATE_UPDATE_MODAL_CONFIG, EUserPermissions } from "@plane/constants";
import { ProjectAutomationsService } from "@plane/services";
import {
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
import { RootStore } from "@/plane-web/store/root.store";
// local imports
import { IAutomationInstance, TAutomationHelpers } from "./automation";
import { TAutomationBaseNodeHelpers } from "./node/base";
import { AutomationsRootStore } from "./root.store";

export interface IProjectAutomationsStore {
  // observables
  loaderMap: Map<string, TLoader>; // project id -> loader
  fetchStatusMap: Map<string, boolean>; // automation id -> fetch status (true only if automation details are fetched)
  // modal data
  createUpdateModalConfig: TCreateUpdateModalConfig;
  // helpers
  isAnyAutomationAvailable: boolean;
  currentProjectAutomationIds: string[];
  getIsInitializingAutomations: (projectId: string) => boolean;
  getFetchStatusById: (automationId: string) => boolean;
  getProjectAutomations: (projectId: string) => IAutomationInstance[];
  setCreateUpdateModalConfig: (config: TCreateUpdateModalConfig) => void;
  // permissions
  canCurrentUserCreateAutomation: boolean;
  // actions
  fetchAutomations: (workspaceSlug: string, projectId: string) => Promise<TAutomation[]>;
  fetchAutomationDetails: (
    workspaceSlug: string,
    projectId: string,
    automationId: string
  ) => Promise<TAutomationDetails>;
  createAutomation: (data: Partial<TAutomation>) => Promise<IAutomationInstance>;
  deleteAutomation: (automationId: string) => Promise<void>;
}

export class ProjectAutomationsStore implements IProjectAutomationsStore {
  // observables
  loaderMap: IProjectAutomationsStore["loaderMap"] = new Map();
  fetchStatusMap: IProjectAutomationsStore["fetchStatusMap"] = new Map();
  // modal data
  createUpdateModalConfig: IProjectAutomationsStore["createUpdateModalConfig"] = DEFAULT_CREATE_UPDATE_MODAL_CONFIG;
  // service
  service: ProjectAutomationsService;
  // root store
  automationsRoot: AutomationsRootStore;
  rootStore: RootStore;

  constructor(automationsRoot: AutomationsRootStore, rootStore: RootStore) {
    makeObservable(this, {
      // observables
      loaderMap: observable,
      fetchStatusMap: observable,
      createUpdateModalConfig: observable,
      // computed
      isAnyAutomationAvailable: computed,
      currentProjectAutomationIds: computed,
      canCurrentUserCreateAutomation: computed,
      // actions
      setCreateUpdateModalConfig: action,
    });
    // initialize service
    this.service = new ProjectAutomationsService();
    // initialize root store
    this.automationsRoot = automationsRoot;
    this.rootStore = rootStore;
  }

  // helpers
  private _automationActions(
    workspaceSlug: string,
    projectId: string,
    automationId: string
  ): TAutomationHelpers["actions"] {
    return {
      update: async (automationId: string, payload: Partial<TAutomation>) =>
        await this.service.update(workspaceSlug, projectId, automationId, payload),
      updateStatus: async (automationId: string, isEnabled: boolean) =>
        await this.service.updateStatus(workspaceSlug, projectId, automationId, isEnabled),
      createNode: async <T extends TAutomationNode>(payload: Partial<T>) =>
        await this.service.createNode<T>(workspaceSlug, projectId, automationId, payload),
      deleteNode: async (nodeId: string) =>
        await this.service.deleteNode(workspaceSlug, projectId, automationId, nodeId),
      createEdge: async (sourceNodeId: string, targetNodeId: string) =>
        await this.service.createEdge(workspaceSlug, projectId, automationId, sourceNodeId, targetNodeId),
      deleteEdge: async (edgeId: string) =>
        await this.service.deleteEdge(workspaceSlug, projectId, automationId, edgeId),
    };
  }

  private _automationNodeActions(
    workspaceSlug: string,
    projectId: string,
    automationId: string
  ): TAutomationBaseNodeHelpers<EAutomationNodeType, TAutomationNodeHandlerName, TAutomationNodeConfig>["actions"] {
    return {
      update: async (
        nodeId: string,
        payload: Partial<TAutomationNode<EAutomationNodeType, TAutomationNodeHandlerName, TAutomationNodeConfig>>
      ) => await this.service.updateNode(workspaceSlug, projectId, automationId, nodeId, payload),
    };
  }

  private _addOrUpdateAutomationNodeToStore = (
    workspaceSlug: string,
    projectId: string,
    automationId: string,
    node: TAutomationNode
  ) => {
    const automationInstance = this.automationsRoot.getAutomationById(automationId);
    if (!automationInstance) throw new Error("Automation not found");
    automationInstance.addOrUpdateNode(node, {
      actions: this._automationNodeActions(workspaceSlug, projectId, automationId),
      permissions: this._automationNodePermissions,
    });
  };

  private _addOrUpdateAutomationEdgeToStore = (automationId: string, edge: TAutomationNodeEdge) => {
    const automationInstance = this.automationsRoot.getAutomationById(automationId);
    if (!automationInstance) throw new Error("Automation not found");
    automationInstance.addOrUpdateEdge(edge);
  };

  private _automationActivityActions(
    workspaceSlug: string,
    projectId: string,
    automationId: string
  ): TAutomationHelpers["activityHelpers"]["actions"] {
    return {
      fetch: async (filters) => await this.service.listActivities(workspaceSlug, projectId, automationId, filters),
    };
  }

  private _addOrUpdateAutomationToStore = (
    workspaceSlug: string,
    projectId: string,
    automationId: string,
    automation: TAutomation,
    nodes?: TAutomationNode[],
    edges?: TAutomationNodeEdge[]
  ) => {
    const automationInstance = this.automationsRoot.addOrUpdateAutomation(automation, {
      actions: this._automationActions(workspaceSlug, projectId, automationId),
      permissions: this._automationPermissions,
      nodeHelpers: {
        actions: this._automationNodeActions(workspaceSlug, projectId, automationId),
        permissions: this._automationNodePermissions,
      },
      activityHelpers: {
        actions: this._automationActivityActions(workspaceSlug, projectId, automationId),
      },
    });
    for (const node of nodes ?? []) {
      this._addOrUpdateAutomationNodeToStore(workspaceSlug, projectId, automationId, node);
    }
    for (const edge of edges ?? []) {
      this._addOrUpdateAutomationEdgeToStore(automationId, edge);
    }
    return automationInstance;
  };

  get currentProjectAutomationIds() {
    const projectId = this.rootStore.projectRoot.project.currentProjectDetails?.id;
    if (!projectId) return [];
    const allProjectAutomations = this.automationsRoot.getAllAutomations();
    const filteredProjectAutomations = allProjectAutomations.filter((d) => d.project === projectId);
    return filteredProjectAutomations.map((d) => d.id);
  }

  get isAnyAutomationAvailable() {
    return this.currentProjectAutomationIds.length > 0;
  }

  getIsInitializingAutomations: IProjectAutomationsStore["getIsInitializingAutomations"] = computedFn(
    (projectId) => this.loaderMap.get(projectId) === "init-loader"
  );

  getFetchStatusById: IProjectAutomationsStore["getFetchStatusById"] = computedFn(
    (automationId) => !!this.fetchStatusMap.get(automationId)
  );

  getProjectAutomations: IProjectAutomationsStore["getProjectAutomations"] = computedFn((projectId) =>
    this.automationsRoot.getAllAutomations().filter((d) => d.project === projectId)
  );

  // permissions
  get _currentUserProjectRole() {
    const currentWorkspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    const currentProjectId = this.rootStore.projectRoot.project.currentProjectDetails?.id;
    const currentProjectRole =
      currentWorkspaceSlug && currentProjectId
        ? this.rootStore.user.permission.getProjectRoleByWorkspaceSlugAndProjectId(
            currentWorkspaceSlug,
            currentProjectId
          )
        : undefined;
    return currentProjectRole;
  }

  private get _automationPermissions() {
    return {
      canCurrentUserCreate: this._currentUserProjectRole === EUserPermissions.ADMIN,
      canCurrentUserEdit: this._currentUserProjectRole === EUserPermissions.ADMIN,
      canCurrentUserDelete: this._currentUserProjectRole === EUserPermissions.ADMIN,
    };
  }

  private get _automationNodePermissions() {
    return {
      canCurrentUserCreate: this._currentUserProjectRole === EUserPermissions.ADMIN,
      canCurrentUserEdit: this._currentUserProjectRole === EUserPermissions.ADMIN,
      canCurrentUserDelete: this._currentUserProjectRole === EUserPermissions.ADMIN,
    };
  }

  get canCurrentUserCreateAutomation() {
    return this._automationPermissions.canCurrentUserCreate;
  }

  // automation crud
  fetchAutomations: IProjectAutomationsStore["fetchAutomations"] = async (workspaceSlug, projectId) => {
    try {
      // make api call
      this.loaderMap.set(projectId, this.loaderMap.get(projectId) ?? "init-loader");
      const res = await this.service.list(workspaceSlug, projectId);
      if (!res) throw new Error("No response found");
      // update observable
      runInAction(() => {
        for (const automation of res) {
          if (automation.id) {
            this._addOrUpdateAutomationToStore(workspaceSlug, projectId, automation.id, automation);
          }
        }
        this.loaderMap.set(projectId, "loaded");
      });
      return res;
    } catch (error) {
      console.error("Error in fetching project automations:", error);
      this.loaderMap.set(projectId, "loaded");
      throw error;
    }
  };

  fetchAutomationDetails: IProjectAutomationsStore["fetchAutomationDetails"] = async (
    workspaceSlug,
    projectId,
    automationId
  ) => {
    try {
      // make api call
      const res = await this.service.retrieve(workspaceSlug, projectId, automationId);
      if (!res) throw new Error("No response found");
      // update observable
      runInAction(() => {
        const { nodes, edges, ...automation } = res;
        this._addOrUpdateAutomationToStore(workspaceSlug, projectId, automationId, automation, nodes, edges);
        this.fetchStatusMap.set(automationId, true);
      });
      return res;
    } catch (error) {
      console.error("Error in fetching project automation details:", error);
      throw error;
    }
  };

  createAutomation: IProjectAutomationsStore["createAutomation"] = async (data) => {
    const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    const projectId = this.rootStore.projectRoot.project.currentProjectDetails?.id;
    if (!workspaceSlug || !projectId) throw new Error("workspaceSlug or projectId not found");
    try {
      // make api call
      this.loaderMap.set(projectId, "mutation");
      const res = await this.service.create(workspaceSlug, projectId, data);
      const resId = res.id;
      if (!res || !resId) throw new Error("No response found");
      // update observable
      const automationInstance = runInAction(() =>
        this._addOrUpdateAutomationToStore(workspaceSlug, projectId, resId, res)
      );
      this.loaderMap.set(projectId, "loaded");
      return automationInstance;
    } catch (error) {
      console.error("Error in creating project automation:", error);
      this.loaderMap.set(projectId, "loaded");
      throw error;
    }
  };

  deleteAutomation: IProjectAutomationsStore["deleteAutomation"] = async (automationId) => {
    const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    const projectId = this.rootStore.projectRoot.project.currentProjectDetails?.id;
    if (!workspaceSlug || !projectId) throw new Error("workspaceSlug or projectId not found");
    try {
      this.loaderMap.set(projectId, "mutation");
      // make api call
      await this.service.destroy(workspaceSlug, projectId, automationId);
      // update observable
      runInAction(() => {
        this.automationsRoot.removeAutomation(automationId);
        this.loaderMap.set(projectId, "loaded");
      });
    } catch (error) {
      console.error("Error in deleting project automation:", error);
      this.loaderMap.set(projectId, "loaded");
      throw error;
    }
  };

  // modal helpers
  setCreateUpdateModalConfig: IProjectAutomationsStore["setCreateUpdateModalConfig"] = (config) => {
    runInAction(() => {
      this.createUpdateModalConfig = config;
    });
  };
}
