import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane imports
import { EAutomationNodeType, TAutomationNode, TAutomationNodeConfig, TAutomationNodeHandlerName } from "@plane/types";

export interface IAutomationBaseNode<
  T extends EAutomationNodeType,
  H extends TAutomationNodeHandlerName,
  C extends TAutomationNodeConfig,
> extends TAutomationNode<T, H, C> {
  // permissions
  canCurrentUserEdit: boolean;
  canCurrentUserDelete: boolean;
  // helpers
  asJSON: TAutomationNode<T, H, C>;
  // helper actions
  mutate: (data: Partial<TAutomationNode<T, H, C>>) => void;
  // actions
  update: (data: Partial<TAutomationNode<T, H, C>>) => Promise<TAutomationNode<T, H, C>>;
}

export type TAutomationBaseNodeHelpers<
  T extends EAutomationNodeType,
  H extends TAutomationNodeHandlerName,
  C extends TAutomationNodeConfig,
> = {
  actions: {
    update: (nodeId: string, payload: Partial<TAutomationNode<T, H, C>>) => Promise<TAutomationNode<T, H, C>>;
  };
  permissions: {
    canCurrentUserEdit: boolean;
    canCurrentUserDelete: boolean;
  };
};

export abstract class AutomationBaseNode<
  T extends EAutomationNodeType,
  H extends TAutomationNodeHandlerName,
  C extends TAutomationNodeConfig,
> implements IAutomationBaseNode<T, H, C>
{
  // node properties
  config: TAutomationNode<T, H, C>["config"];
  created_at: TAutomationNode<T, H, C>["created_at"];
  created_by: TAutomationNode<T, H, C>["created_by"];
  handler_name: TAutomationNode<T, H, C>["handler_name"];
  id: TAutomationNode<T, H, C>["id"];
  is_enabled: TAutomationNode<T, H, C>["is_enabled"];
  name: TAutomationNode<T, H, C>["name"];
  node_type: TAutomationNode<T, H, C>["node_type"];
  project: TAutomationNode<T, H, C>["project"];
  updated_at: TAutomationNode<T, H, C>["updated_at"];
  updated_by: TAutomationNode<T, H, C>["updated_by"];
  workspace: TAutomationNode<T, H, C>["workspace"];
  // actions
  private helpers: TAutomationBaseNodeHelpers<T, H, C>;

  constructor(node: TAutomationNode<T, H, C>, helpers: TAutomationBaseNodeHelpers<T, H, C>) {
    // initialize node properties
    this.config = node.config;
    this.created_at = node.created_at;
    this.created_by = node.created_by;
    this.handler_name = node.handler_name;
    this.id = node.id;
    this.is_enabled = node.is_enabled;
    this.name = node.name;
    this.node_type = node.node_type;
    this.project = node.project;
    this.updated_at = node.updated_at;
    this.updated_by = node.updated_by;
    this.workspace = node.workspace;
    // initialize helpers
    this.helpers = helpers;

    makeObservable(this, {
      // observables
      config: observable.ref,
      created_at: observable.ref,
      created_by: observable.ref,
      handler_name: observable.ref,
      id: observable.ref,
      is_enabled: observable.ref,
      name: observable.ref,
      node_type: observable.ref,
      project: observable.ref,
      updated_at: observable.ref,
      updated_by: observable.ref,
      workspace: observable.ref,
      // helpers
      canCurrentUserEdit: computed,
      canCurrentUserDelete: computed,
      asJSON: computed,
      // helper actions
      mutate: action,
      // actions
      update: action,
    });
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
      config: this.config,
      created_at: this.created_at,
      created_by: this.created_by,
      handler_name: this.handler_name,
      id: this.id,
      is_enabled: this.is_enabled,
      name: this.name,
      node_type: this.node_type,
      project: this.project,
      updated_at: this.updated_at,
      updated_by: this.updated_by,
      workspace: this.workspace,
    };
  }

  // actions
  mutate: IAutomationBaseNode<T, H, C>["mutate"] = action((data) => {
    if (!this.id) return;
    runInAction(() => {
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const dataKey = key as keyof TAutomationNode<T, H, C>;
          set(this, [dataKey], data[dataKey]);
        }
      }
    });
  });

  update: IAutomationBaseNode<T, H, C>["update"] = action(async (data) => {
    const originalNode = { ...this.asJSON };
    try {
      // optimistically update
      this.mutate(data);
      const res = await this.helpers.actions.update(this.id, data);
      return res;
    } catch (error) {
      // revert changes
      this.mutate(originalNode);
      // update loader
      console.error("Error in updating node:", error);
      throw error;
    }
  });
}
