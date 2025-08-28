import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane imports
import { EUserPermissions } from "@plane/constants";
import {
  EUserProjectRoles,
  EUserWorkspaceRoles,
  TUserPermissions,
  IRecurringWorkItemActionCallbacks,
  TRecurringWorkItem,
} from "@plane/types";
// plane web imports
import { RootStore } from "@/plane-web/store/root.store";

export type TRecurringWorkItemInstanceProps = {
  root: RootStore;
  updateActionCallback: IRecurringWorkItemActionCallbacks["update"];
  recurringWorkItemData: TRecurringWorkItem;
};

export interface IRecurringWorkItemInstance extends TRecurringWorkItem {
  // computed
  asJSON: TRecurringWorkItem;
  getWorkspaceSlugForRecurringWorkItemInstance: string | undefined;
  getUserRoleForRecurringWorkItemInstance:
    | TUserPermissions
    | EUserPermissions
    | EUserWorkspaceRoles
    | EUserProjectRoles
    | undefined;
  canCurrentUserEdit: boolean;
  canCurrentUserToggleEnabled: boolean;
  canCurrentUserDelete: boolean;
  // helper actions
  mutateInstance: (recurringWorkItemData: Partial<TRecurringWorkItem>) => void;
  // actions
  update: (recurringWorkItemData: Partial<TRecurringWorkItem>) => Promise<void>;
}

export class RecurringWorkItemInstance implements IRecurringWorkItemInstance {
  // properties
  id: TRecurringWorkItem["id"];
  workitem_blueprint: TRecurringWorkItem["workitem_blueprint"];
  enabled: TRecurringWorkItem["enabled"];
  start_at: TRecurringWorkItem["start_at"];
  end_at: TRecurringWorkItem["end_at"];
  interval_type: TRecurringWorkItem["interval_type"];
  workspace: TRecurringWorkItem["workspace"];
  project: TRecurringWorkItem["project"];
  created_at: TRecurringWorkItem["created_at"];
  updated_at: TRecurringWorkItem["updated_at"];

  // root store
  protected rootStore: TRecurringWorkItemInstanceProps["root"];

  // service
  protected updateActionCallback: TRecurringWorkItemInstanceProps["updateActionCallback"];

  constructor(protected store: TRecurringWorkItemInstanceProps) {
    const { root, updateActionCallback, recurringWorkItemData } = store;

    // properties
    this.id = recurringWorkItemData.id;
    this.workitem_blueprint = recurringWorkItemData.workitem_blueprint;
    this.enabled = recurringWorkItemData.enabled;
    this.start_at = recurringWorkItemData.start_at;
    this.end_at = recurringWorkItemData.end_at;
    this.interval_type = recurringWorkItemData.interval_type;
    this.workspace = recurringWorkItemData.workspace;
    this.project = recurringWorkItemData.project;
    this.created_at = recurringWorkItemData.created_at;
    this.updated_at = recurringWorkItemData.updated_at;

    // root store
    this.rootStore = root;

    // service
    this.updateActionCallback = updateActionCallback;

    makeObservable(this, {
      // observables
      id: observable,
      workitem_blueprint: observable,
      enabled: observable,
      start_at: observable,
      end_at: observable,
      interval_type: observable,
      workspace: observable,
      project: observable,
      created_at: observable,
      updated_at: observable,
      // computed
      asJSON: computed,
      getUserRoleForRecurringWorkItemInstance: computed,
      canCurrentUserEdit: computed,
      canCurrentUserDelete: computed,
      // actions
      mutateInstance: action,
      update: action,
    });
  }

  // computed
  /**
   * @description Returns the template as JSON
   */
  get asJSON(): TRecurringWorkItem {
    return {
      id: this.id,
      workitem_blueprint: this.workitem_blueprint,
      enabled: this.enabled,
      start_at: this.start_at,
      end_at: this.end_at,
      interval_type: this.interval_type,
      workspace: this.workspace,
      project: this.project,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  /**
   * @description Returns the workspace slug for the template instance
   */
  get getWorkspaceSlugForRecurringWorkItemInstance() {
    return this.rootStore.workspaceRoot.getWorkspaceById(this.workspace)?.slug;
  }

  /**
   * @description Returns the user role for the recurring work item instance
   */
  get getUserRoleForRecurringWorkItemInstance() {
    const workspaceSlug = this.rootStore.workspaceRoot.getWorkspaceById(this.workspace)?.slug;
    if (!workspaceSlug || !this.project) return undefined;
    return this.rootStore.user.permission.getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, this.project);
  }

  /**
   * @description Returns true if the current user can edit the recurring work item
   */
  get canCurrentUserEdit(): boolean {
    return this.getUserRoleForRecurringWorkItemInstance === EUserPermissions.ADMIN;
  }

  /**
   * @description Returns true if the current user can toggle the recurring work item enabled status
   */
  get canCurrentUserToggleEnabled(): boolean {
    return this.getUserRoleForRecurringWorkItemInstance === EUserPermissions.ADMIN;
  }

  /**
   * @description Returns true if the current user can delete the recurring work item
   */
  get canCurrentUserDelete(): boolean {
    return this.getUserRoleForRecurringWorkItemInstance === EUserPermissions.ADMIN;
  }

  // helper actions
  /**
   * @description Update recurring work item instance
   * @param recurringWorkItemData Recurring work item data
   */
  mutateInstance = action((recurringWorkItemData: Partial<TRecurringWorkItem>): void => {
    if (!this.id) return;
    runInAction(() => {
      for (const key in recurringWorkItemData) {
        if (recurringWorkItemData.hasOwnProperty(key)) {
          const recurringWorkItemKey = key as keyof TRecurringWorkItem;
          set(this, recurringWorkItemKey, recurringWorkItemData[recurringWorkItemKey]);
        }
      }
    });
  });

  // actions
  /**
   * @description Updates the recurring work item on the server and updates the instance
   * @param recurringWorkItemData Recurring work item data
   */
  update = action(async (recurringWorkItemData: Partial<TRecurringWorkItem>): Promise<void> => {
    if (!this.id) return;
    try {
      const updatedRecurringWorkItem = await this.updateActionCallback(this.id, {
        // Include project and workspace to route update request to correct service
        project: this.project,
        workspace: this.workspace,
        ...recurringWorkItemData,
      });
      this.mutateInstance(updatedRecurringWorkItem);
    } catch (error) {
      console.error("RecurringWorkItemInstance.update -> error", error);
      throw error;
    }
  });
}
