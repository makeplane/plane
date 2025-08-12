import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import {
  EAutomationNodeType,
  EAutomationStatus,
  EConditionNodeHandlerName,
  LOGICAL_OPERATOR,
  TAutomation,
  TAutomationActionNode,
  TAutomationActivity,
  TAutomationConditionNode,
  TAutomationNode,
  TAutomationNodeConfig,
  TAutomationNodeEdge,
  TAutomationNodeHandlerName,
  TAutomationTriggerNode,
  TCreateActionPayload,
  TCreateConditionPayload,
  TCreateTriggerResponse,
  TCreateTriggerPayload,
  TAutomationActivityFilters,
} from "@plane/types";
import { joinUrlPath } from "@plane/utils";
// plane web imports
import type { RootStore } from "@/plane-web/store/root.store";
// local imports
import { AutomationActivityStore } from "./automation-activity";
import {
  AutomationActionNodeInstance,
  type IAutomationActionNodeInstance,
  type TAutomationActionNodeHelpers,
} from "./node/action";
import type { TAutomationBaseNodeHelpers } from "./node/base";
import {
  AutomationConditionNodeInstance,
  type IAutomationConditionNodeInstance,
  type TAutomationConditionNodeHelpers,
} from "./node/condition/root";
import {
  AutomationTriggerNodeInstance,
  type IAutomationTriggerNodeInstance,
  type TAutomationTriggerNodeHelpers,
} from "./node/trigger";
import { AutomationSidebarHelper, IAutomationSidebarHelper } from "./sidebar-helper";

type TAutomationNodeInstance =
  | IAutomationTriggerNodeInstance
  | IAutomationConditionNodeInstance
  | IAutomationActionNodeInstance;

export interface IAutomationInstance extends TAutomation {
  // properties
  workspaceSlug: string;
  // nodes and edges
  trigger: IAutomationTriggerNodeInstance | undefined;
  conditions: Map<string, IAutomationConditionNodeInstance>; // condition node id => condition node instance
  actions: Map<string, IAutomationActionNodeInstance>; // action node id => action node instance
  edges: Map<string, TAutomationNodeEdge>; // source node id => target node id
  // sidebar
  sidebarHelper: IAutomationSidebarHelper;
  // permissions
  canCurrentUserEdit: boolean;
  canCurrentUserDelete: boolean;
  // helpers
  asJSON: TAutomation;
  redirectionLink: string;
  allActions: IAutomationActionNodeInstance[];
  allConditions: IAutomationConditionNodeInstance[];
  allEdges: TAutomationNodeEdge[];
  isTriggerNodeAvailable: boolean;
  isAnyActionNodeAvailable: boolean;
  isAnyConditionNodeAvailable: boolean;
  getActionById: (id: string) => IAutomationActionNodeInstance | undefined;
  getConditionById: (id: string) => IAutomationConditionNodeInstance | undefined;
  getNodeById: (id: string) => TAutomationNodeInstance | undefined;
  getNodeByTypeAndId: (nodeType: EAutomationNodeType, id: string) => TAutomationNodeInstance | undefined;
  getEdgeBySourceNodeId: (sourceNodeId: string) => TAutomationNodeEdge | undefined;
  // helper actions
  addOrUpdateTrigger: (trigger: TAutomationTriggerNode, helpers: TAutomationTriggerNodeHelpers) => void;
  addOrUpdateAction: (action: TAutomationActionNode, helpers: TAutomationActionNodeHelpers) => void;
  addOrUpdateCondition: (condition: TAutomationConditionNode, helpers: TAutomationConditionNodeHelpers) => void;
  addOrUpdateNode: (
    node: TAutomationNode,
    helpers: TAutomationBaseNodeHelpers<EAutomationNodeType, TAutomationNodeHandlerName, TAutomationNodeConfig>
  ) => void;
  addOrUpdateEdge: (edge: TAutomationNodeEdge) => void;
  mutate: (data: Partial<TAutomation>) => void;
  // actions
  update: (data: Partial<TAutomation>) => Promise<TAutomation>;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  createTrigger: (payload: TCreateTriggerPayload) => Promise<TCreateTriggerResponse>;
  createAction: (payload: TCreateActionPayload) => Promise<TAutomationActionNode>;
  createCondition: (payload: TCreateConditionPayload) => Promise<TAutomationConditionNode>;
  deleteAction: (actionNodeId: string) => Promise<void>;
  createEdge: (sourceNodeId: string, targetNodeId: string) => void;
  deleteEdge: (edgeId: string) => Promise<void>;
  // activity
  activity: AutomationActivityStore;
}

export type TAutomationHelpers = {
  actions: {
    update: (automationId: string, payload: Partial<TAutomation>) => Promise<TAutomation>;
    updateStatus: (automationId: string, isEnabled: boolean) => Promise<TAutomation>;
    createNode: <T extends TAutomationNode>(payload: Partial<T>) => Promise<T>;
    deleteNode: (nodeId: string) => Promise<void>;
    createEdge: (sourceNodeId: string, targetNodeId: string) => Promise<TAutomationNodeEdge>;
    deleteEdge: (edgeId: string) => Promise<void>;
  };
  permissions: {
    canCurrentUserEdit: boolean;
    canCurrentUserDelete: boolean;
  };
  nodeHelpers: TAutomationBaseNodeHelpers<EAutomationNodeType, TAutomationNodeHandlerName, TAutomationNodeConfig>;
  activityHelpers: {
    actions: {
      fetch: (filters: TAutomationActivityFilters) => Promise<TAutomationActivity[]>;
    };
  };
};

export class AutomationInstance implements IAutomationInstance {
  // automation properties
  average_run_time: TAutomation["average_run_time"];
  created_at: TAutomation["created_at"];
  created_by: TAutomation["created_by"];
  description: TAutomation["description"];
  id: TAutomation["id"];
  is_enabled: TAutomation["is_enabled"];
  last_run_at: TAutomation["last_run_at"];
  last_run_status: TAutomation["last_run_status"];
  name: TAutomation["name"];
  project: TAutomation["project"];
  run_count: TAutomation["run_count"];
  scope: TAutomation["scope"];
  status: TAutomation["status"];
  total_failed_count: TAutomation["total_failed_count"];
  total_success_count: TAutomation["total_success_count"];
  updated_at: TAutomation["updated_at"];
  updated_by: TAutomation["updated_by"];
  workspace: TAutomation["workspace"];
  // nodes and edges
  trigger: IAutomationInstance["trigger"];
  conditions: IAutomationInstance["conditions"];
  actions: IAutomationInstance["actions"];
  edges: IAutomationInstance["edges"];
  // actions
  sidebarHelper: IAutomationSidebarHelper;
  private helpers: TAutomationHelpers;
  // root store
  activity: AutomationActivityStore;
  private rootStore: RootStore;

  constructor(store: RootStore, automation: TAutomation, helpers: TAutomationHelpers) {
    // initialize automation properties
    this.average_run_time = automation.average_run_time;
    this.created_at = automation.created_at;
    this.created_by = automation.created_by;
    this.description = automation.description;
    this.id = automation.id;
    this.is_enabled = automation.is_enabled;
    this.last_run_at = automation.last_run_at;
    this.last_run_status = automation.last_run_status;
    this.name = automation.name;
    this.project = automation.project;
    this.run_count = automation.run_count;
    this.scope = automation.scope;
    this.status = automation.status;
    this.total_failed_count = automation.total_failed_count;
    this.total_success_count = automation.total_success_count;
    this.updated_at = automation.updated_at;
    this.updated_by = automation.updated_by;
    this.workspace = automation.workspace;
    // initialize nodes and edges
    this.trigger = undefined;
    this.conditions = new Map();
    this.actions = new Map();
    this.edges = new Map();
    // initialize helpers
    this.helpers = helpers;
    this.sidebarHelper = new AutomationSidebarHelper();
    // initialize root store
    this.activity = new AutomationActivityStore(helpers.activityHelpers);
    this.rootStore = store;

    makeObservable(this, {
      // observables
      average_run_time: observable.ref,
      created_at: observable.ref,
      created_by: observable.ref,
      description: observable.ref,
      id: observable.ref,
      is_enabled: observable.ref,
      last_run_at: observable.ref,
      last_run_status: observable.ref,
      name: observable.ref,
      project: observable.ref,
      run_count: observable.ref,
      scope: observable.ref,
      status: observable.ref,
      total_failed_count: observable.ref,
      total_success_count: observable.ref,
      updated_at: observable.ref,
      updated_by: observable.ref,
      workspace: observable.ref,
      trigger: observable,
      conditions: observable,
      actions: observable,
      edges: observable,
      sidebarHelper: observable,
      // computed
      workspaceSlug: computed,
      canCurrentUserEdit: computed,
      canCurrentUserDelete: computed,
      asJSON: computed,
      redirectionLink: computed,
      allActions: computed,
      allConditions: computed,
      allEdges: computed,
      // actions
      mutate: action,
      update: action,
      enable: action,
      disable: action,
      createTrigger: action,
      createAction: action,
      createCondition: action,
      deleteAction: action,
      createEdge: action,
      deleteEdge: action,
    });
  }

  // derived properties
  get workspaceSlug() {
    const workspaceSlug = this.rootStore.workspaceRoot.getWorkspaceById(this.workspace)?.slug;
    if (!workspaceSlug) throw new Error("Workspace not found");
    return workspaceSlug;
  }

  // permissions
  get canCurrentUserEdit() {
    return this.helpers.permissions.canCurrentUserEdit;
  }

  get canCurrentUserDelete() {
    return this.helpers.permissions.canCurrentUserDelete;
  }

  // helpers
  get asJSON() {
    return {
      average_run_time: this.average_run_time,
      created_at: this.created_at,
      created_by: this.created_by,
      description: this.description,
      id: this.id,
      is_enabled: this.is_enabled,
      last_run_at: this.last_run_at,
      last_run_status: this.last_run_status,
      name: this.name,
      project: this.project,
      run_count: this.run_count,
      scope: this.scope,
      status: this.status,
      total_failed_count: this.total_failed_count,
      total_success_count: this.total_success_count,
      updated_at: this.updated_at,
      updated_by: this.updated_by,
      workspace: this.workspace,
    };
  }

  get redirectionLink() {
    return joinUrlPath(this.workspaceSlug, "projects", this.project, "automations", this.id);
  }

  get allActions() {
    return Array.from(this.actions.values());
  }

  get allConditions() {
    return Array.from(this.conditions.values());
  }

  get allEdges() {
    return Array.from(this.edges.values());
  }

  get isTriggerNodeAvailable() {
    return !!this.trigger;
  }

  get isAnyActionNodeAvailable() {
    return this.allActions.length > 0;
  }

  get isAnyConditionNodeAvailable() {
    return this.allConditions.length > 0;
  }

  getActionById: IAutomationInstance["getActionById"] = computedFn((id) => this.actions.get(id));

  getConditionById: IAutomationInstance["getConditionById"] = computedFn((id) => this.conditions.get(id));

  getNodeById: IAutomationInstance["getNodeById"] = computedFn((id) => {
    const isNodeTrigger = this.trigger?.id === id;
    if (isNodeTrigger) {
      return this.trigger;
    }
    const isNodeAction = this.actions.has(id);
    if (isNodeAction) {
      return this.actions.get(id);
    }
    const isNodeCondition = this.conditions.has(id);
    if (isNodeCondition) {
      return this.conditions.get(id);
    }

    return undefined;
  });

  getNodeByTypeAndId: IAutomationInstance["getNodeByTypeAndId"] = computedFn((nodeType, id) => {
    if (nodeType === EAutomationNodeType.TRIGGER) {
      return this.trigger;
    } else if (nodeType === EAutomationNodeType.ACTION) {
      return this.getActionById(id);
    } else if (nodeType === EAutomationNodeType.CONDITION) {
      return this.getConditionById(id);
    }

    return undefined;
  });

  getEdgeBySourceNodeId: IAutomationInstance["getEdgeBySourceNodeId"] = computedFn((sourceNodeId) =>
    this.allEdges.find((edge) => edge.source_node === sourceNodeId)
  );

  // actions

  addOrUpdateTrigger: IAutomationInstance["addOrUpdateTrigger"] = (trigger, helpers) => {
    if (this.trigger) {
      this.trigger.mutate(trigger);
    } else {
      this.trigger = new AutomationTriggerNodeInstance(trigger, helpers);
    }
  };

  addOrUpdateAction: IAutomationInstance["addOrUpdateAction"] = (action, helpers) => {
    if (this.actions.has(action.id)) {
      this.actions.get(action.id)?.mutate(action);
    } else {
      this.actions.set(action.id, new AutomationActionNodeInstance(action, helpers));
    }
  };

  addOrUpdateCondition: IAutomationInstance["addOrUpdateCondition"] = (condition, helpers) => {
    if (this.conditions.has(condition.id)) {
      this.conditions.get(condition.id)?.mutate(condition);
    } else {
      this.conditions.set(condition.id, new AutomationConditionNodeInstance(condition, helpers));
    }
  };

  // TODO: Figure out a better way to handle this instead of type castings
  addOrUpdateNode: IAutomationInstance["addOrUpdateNode"] = (node, helpers) => {
    if (node.node_type === EAutomationNodeType.TRIGGER) {
      this.addOrUpdateTrigger(node as TAutomationTriggerNode, helpers as TAutomationTriggerNodeHelpers);
    } else if (node.node_type === EAutomationNodeType.ACTION) {
      this.addOrUpdateAction(node as TAutomationActionNode, helpers as TAutomationActionNodeHelpers);
    } else if (node.node_type === EAutomationNodeType.CONDITION) {
      this.addOrUpdateCondition(node as TAutomationConditionNode, helpers as TAutomationConditionNodeHelpers);
    }
  };

  addOrUpdateEdge: IAutomationInstance["addOrUpdateEdge"] = (edge) => {
    this.edges.set(edge.source_node, edge);
  };

  mutate: IAutomationInstance["mutate"] = (data) => {
    runInAction(() => {
      Object.keys(data).map((key) => {
        const dataKey = key as keyof TAutomation;
        set(this, [dataKey], data[dataKey]);
      });
    });
  };

  update: IAutomationInstance["update"] = async (data) => {
    const originalAutomation = { ...this.asJSON };
    try {
      // optimistically update
      this.mutate(data);
      const res = await this.helpers.actions.update(this.id, data);
      return res;
    } catch (error) {
      // revert changes
      this.mutate(originalAutomation);
      // update loader
      console.error("Error in updating automation:", error);
      throw error;
    }
  };

  enable: IAutomationInstance["enable"] = async () => {
    try {
      if (!this.isTriggerNodeAvailable || !this.isAnyActionNodeAvailable) {
        throw new Error("Automation must have at least one trigger and one action to be enabled.");
      }
      await this.helpers.actions.updateStatus(this.id, true);
      runInAction(() => {
        this.mutate({
          is_enabled: true,
          status: EAutomationStatus.PUBLISHED,
        });
      });
    } catch (error) {
      console.error("Error in updating automation:", error);
      throw error;
    }
  };

  disable: IAutomationInstance["disable"] = async () => {
    try {
      await this.helpers.actions.updateStatus(this.id, false);
      runInAction(() => {
        this.mutate({
          is_enabled: false,
          status: EAutomationStatus.DISABLED,
        });
      });
    } catch (error) {
      console.error("Error in updating automation:", error);
      throw error;
    }
  };

  private _createNode = async <T extends TAutomationNode>(
    nodeType: EAutomationNodeType,
    payload: Partial<T>,
    previousNodeId?: string
  ): Promise<T> => {
    try {
      const res = await this.helpers.actions.createNode<T>({
        ...payload,
        node_type: nodeType,
      });
      if (previousNodeId) {
        this.createEdge(previousNodeId, res.id);
      }
      runInAction(() => {
        this.addOrUpdateNode(res, this.helpers.nodeHelpers);
      });
      return res;
    } catch (error) {
      console.error("Error in creating node:", error);
      throw error;
    }
  };

  createTrigger: IAutomationInstance["createTrigger"] = async (payload) => {
    const trigger = await this._createNode<TAutomationTriggerNode>(EAutomationNodeType.TRIGGER, {
      name: `Trigger_${payload.handler_name}_${new Date().toISOString()}`,
      ...payload,
    });

    const condition = await this._createNode<TAutomationConditionNode>(EAutomationNodeType.CONDITION, {
      name: `Condition_${trigger.handler_name}_${new Date().toISOString()}`,
      handler_name: EConditionNodeHandlerName.JSON_FILTER,
      config: {
        filter_expression: {
          [LOGICAL_OPERATOR.AND]: [],
        },
      },
    });

    return {
      trigger,
      condition,
    };
  };

  createAction: IAutomationInstance["createAction"] = async (payload) => {
    // We need previous action node to trigger the next action node.
    const previousActionNodeId = this.allActions[this.allActions.length - 1]?.id; // TODO: Need to verify the action node order.
    const previousTriggerNodeId = this.trigger?.id;
    const previousNodeId = previousActionNodeId ?? previousTriggerNodeId;

    if (!previousNodeId) {
      throw new Error("No trigger or previous action node found to create the next action node.");
    }

    const res = await this._createNode(
      EAutomationNodeType.ACTION,
      {
        name: `Action_${payload.handler_name}_${new Date().toISOString()}`,
        ...payload,
      },
      previousNodeId
    );

    return res;
  };

  createCondition: IAutomationInstance["createCondition"] = async (payload) => {
    const triggerNodeId = this.trigger?.id;
    if (!triggerNodeId) {
      throw new Error("No trigger node found to create the condition node.");
    }
    const triggerToActionEdge = this.getEdgeBySourceNodeId(triggerNodeId);

    // If there is an action node available, delete the edge from trigger to action node.
    if (this.isAnyActionNodeAvailable && triggerToActionEdge) {
      await this.deleteEdge(triggerToActionEdge.id);
    }

    // Create the condition node along with an edge from trigger to condition node.
    const res = await this._createNode(EAutomationNodeType.CONDITION, payload, triggerNodeId);

    // If there is an action node available, create a new edge from condition node to action node.
    if (this.isAnyActionNodeAvailable && triggerToActionEdge) {
      await Promise.all([this.createEdge(res.id, triggerToActionEdge.target_node)]);
    }

    return res;
  };

  private _getEdgeChangesForNodeDeletion = (
    nodeIdToDelete: string
  ): {
    edgeIdsToRemove: string[];
    edgesToCreate: { sourceNodeId: string; targetNodeId: string }[];
  } => {
    const edgeIdsToRemove: string[] = [];
    const edgesToCreate: { sourceNodeId: string; targetNodeId: string }[] = [];

    // Find incoming edge (node that points to the node being deleted)
    let incomingSourceNodeId: string | undefined;
    for (const [sourceId, edge] of Array.from(this.edges.entries())) {
      if (edge.target_node === nodeIdToDelete) {
        incomingSourceNodeId = sourceId;
        edgeIdsToRemove.push(sourceId);
        break;
      }
    }

    // Find outgoing edge (node that the deleted node points to)
    const outgoingEdge = this.edges.get(nodeIdToDelete);
    if (outgoingEdge) {
      edgeIdsToRemove.push(nodeIdToDelete); // The edge from deleted node to its target
    }

    // Create new edge to reconnect the chain if both incoming and outgoing exist
    if (incomingSourceNodeId && outgoingEdge) {
      edgesToCreate.push({
        sourceNodeId: incomingSourceNodeId,
        targetNodeId: outgoingEdge.target_node,
      });
    }

    return {
      edgeIdsToRemove,
      edgesToCreate,
    };
  };

  deleteAction: IAutomationInstance["deleteAction"] = async (actionNodeId) => {
    try {
      // Get the edge changes needed
      const { edgeIdsToRemove, edgesToCreate } = this._getEdgeChangesForNodeDeletion(actionNodeId);

      // Delete the action node
      await this.helpers.actions.deleteNode(actionNodeId);

      // Create new edges
      const edgesToCreatePromises = edgesToCreate.map((edge) => this.createEdge(edge.sourceNodeId, edge.targetNodeId));
      await Promise.all(edgesToCreatePromises);

      runInAction(() => {
        this.actions.delete(actionNodeId);
        // Remove all affected edges
        edgeIdsToRemove.forEach((edgeId) => this.edges.delete(edgeId));
      });
    } catch (error) {
      console.error("Error in deleting node:", error);
      throw error;
    }
  };

  createEdge: IAutomationInstance["createEdge"] = async (sourceNodeId, targetNodeId) => {
    try {
      const res = await this.helpers.actions.createEdge(sourceNodeId, targetNodeId);
      runInAction(() => {
        this.addOrUpdateEdge({ id: res.id, source_node: sourceNodeId, target_node: targetNodeId });
      });
      return res;
    } catch (error) {
      console.error("Error in creating edge:", error);
      throw error;
    }
  };

  deleteEdge: IAutomationInstance["deleteEdge"] = async (edgeId) => {
    try {
      await this.helpers.actions.deleteEdge(edgeId);
      runInAction(() => {
        this.edges.delete(edgeId);
      });
    } catch (error) {
      console.error("Error in deleting edge:", error);
      throw error;
    }
  };
}
