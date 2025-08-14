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
  projectAutomationIdsMap: Map<string, Set<string>>; // project id -> automation ids
  // modal data
  createUpdateModalConfig: TCreateUpdateModalConfig;
  // helpers
  getIsInitializingAutomations: (projectId: string) => boolean;
  getFetchStatusById: (automationId: string) => boolean;
  getProjectAutomationIds: (projectId: string) => string[];
  getProjectAutomations: (projectId: string) => IAutomationInstance[];
  isAnyAutomationAvailableForProject: (projectId: string) => boolean;
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
  createAutomation: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TAutomation>
  ) => Promise<IAutomationInstance>;
  deleteAutomation: (workspaceSlug: string, projectId: string, automationId: string) => Promise<void>;
}

export class ProjectAutomationsStore implements IProjectAutomationsStore {
  // observables
  loaderMap: IProjectAutomationsStore["loaderMap"] = new Map();
  fetchStatusMap: IProjectAutomationsStore["fetchStatusMap"] = new Map();
  projectAutomationIdsMap: IProjectAutomationsStore["projectAutomationIdsMap"] = new Map();
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
      projectAutomationIdsMap: observable,
      createUpdateModalConfig: observable,
      // computed
      canCurrentUserCreateAutomation: computed,
      // actions
      fetchAutomations: action,
      fetchAutomationDetails: action,
      createAutomation: action,
      deleteAutomation: action,
      setCreateUpdateModalConfig: action,
    });
    // initialize service
    this.service = new ProjectAutomationsService();
    // initialize root store
    this.automationsRoot = automationsRoot;
    this.rootStore = rootStore;
  }

  // helpers
  private _addAutomationIdToProject = (projectId: string, automationId: string) => {
    const currentIds = this.projectAutomationIdsMap.get(projectId) ?? new Set<string>();
    if (!currentIds.has(automationId)) {
      const updatedIds = new Set(currentIds);
      updatedIds.add(automationId);
      this.projectAutomationIdsMap.set(projectId, updatedIds);
    }
  };

  private _removeAutomationIdFromProject = (projectId: string, automationId: string) => {
    const currentIds = this.projectAutomationIdsMap.get(projectId);
    if (currentIds && currentIds.has(automationId)) {
      const updatedIds = new Set(currentIds);
      updatedIds.delete(automationId);
      this.projectAutomationIdsMap.set(projectId, updatedIds);
    }
  };

  private _automationActions(
    workspaceSlug: string,
    projectId: string,
    automationId: string
  ): TAutomationHelpers["actions"] {
    return {
      update: this.service.update.bind(this.service, workspaceSlug, projectId),
      updateStatus: this.service.updateStatus.bind(this.service, workspaceSlug, projectId),
      createNode: async <T extends TAutomationNode>(payload: Partial<T>) =>
        await this.service.createNode<T>(workspaceSlug, projectId, automationId, payload),
      deleteNode: this.service.deleteNode.bind(this.service, workspaceSlug, projectId, automationId),
      createEdge: this.service.createEdge.bind(this.service, workspaceSlug, projectId, automationId),
      deleteEdge: this.service.deleteEdge.bind(this.service, workspaceSlug, projectId, automationId),
    };
  }

  private _automationNodeActions(
    workspaceSlug: string,
    projectId: string,
    automationId: string
  ): TAutomationBaseNodeHelpers<EAutomationNodeType, TAutomationNodeHandlerName, TAutomationNodeConfig>["actions"] {
    return {
      update: this.service.updateNode.bind(this.service, workspaceSlug, projectId, automationId),
    };
  }

  private _addOrUpdateAutomationNodeToStore = (
    workspaceSlug: string,
    projectId: string,
    automationId: string,
    node: TAutomationNode
  ) => {
    const automationInstance = this.automationsRoot.getAutomationById(automationId);
    automationInstance?.addOrUpdateNode(node, {
      actions: this._automationNodeActions(workspaceSlug, projectId, automationId),
      permissions: this._automationNodePermissions,
    });
  };

  private _addOrUpdateAutomationEdgeToStore = (automationId: string, edge: TAutomationNodeEdge) => {
    const automationInstance = this.automationsRoot.getAutomationById(automationId);
    automationInstance?.addOrUpdateEdge(edge);
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
    // add or update automation to store
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
    // add or update automation nodes to store
    for (const node of nodes ?? []) {
      this._addOrUpdateAutomationNodeToStore(workspaceSlug, projectId, automationId, node);
    }
    // add or update automation edges to store
    for (const edge of edges ?? []) {
      this._addOrUpdateAutomationEdgeToStore(automationId, edge);
    }
    // update project automation ids map
    this._addAutomationIdToProject(projectId, automationId);
    // return automation instance
    return automationInstance;
  };

  getIsInitializingAutomations: IProjectAutomationsStore["getIsInitializingAutomations"] = computedFn(
    (projectId) => this.loaderMap.get(projectId) === "init-loader"
  );

  getFetchStatusById: IProjectAutomationsStore["getFetchStatusById"] = computedFn(
    (automationId) => !!this.fetchStatusMap.get(automationId)
  );

  getProjectAutomationIds: IProjectAutomationsStore["getProjectAutomationIds"] = computedFn((projectId) =>
    Array.from(this.projectAutomationIdsMap.get(projectId) ?? [])
  );

  getProjectAutomations: IProjectAutomationsStore["getProjectAutomations"] = computedFn((projectId) =>
    this.getProjectAutomationIds(projectId)
      .map((id) => this.automationsRoot.getAutomationById(id))
      .filter((a) => a !== undefined)
  );

  isAnyAutomationAvailableForProject: IProjectAutomationsStore["isAnyAutomationAvailableForProject"] = computedFn(
    (projectId) => this.getProjectAutomationIds(projectId).length > 0
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

  createAutomation: IProjectAutomationsStore["createAutomation"] = async (workspaceSlug, projectId, data) => {
    try {
      // make api call
      this.loaderMap.set(projectId, "mutation");
      const res = await this.service.create(workspaceSlug, projectId, data);
      const resId = res.id;
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

  deleteAutomation: IProjectAutomationsStore["deleteAutomation"] = async (workspaceSlug, projectId, automationId) => {
    try {
      this.loaderMap.set(projectId, "mutation");
      // make api call
      await this.service.destroy(workspaceSlug, projectId, automationId);
      // update observable
      runInAction(() => {
        // remove automation from store
        this.automationsRoot.removeAutomation(automationId);
        // remove automation from project automation ids map
        this._removeAutomationIdFromProject(projectId, automationId);
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
