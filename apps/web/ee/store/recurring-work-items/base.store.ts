import orderBy from "lodash/orderBy";
import { action, computed, makeObservable, observable } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { RecurringWorkItemServiceBase } from "@plane/services";
import { IRecurringWorkItemActionCallbacks, TLoader, TRecurringWorkItem } from "@plane/types";
// plane web imports
import { RootStore } from "@/plane-web/store/root.store";
// local imports
import { IRecurringWorkItemInstance, RecurringWorkItemInstance } from "./instance";

export interface IRecurringWorkItemStore {
  // observables
  loader: TLoader; // recurring work item loader
  fetchStatusMap: Map<string, boolean>; // recurring work item id -> boolean
  recurringWorkItems: Map<string, IRecurringWorkItemInstance>; // recurring work item id -> recurring work item
  // computed
  isRecurringWorkItemsInitializing: boolean;
  // computed functions
  getRecurringWorkItemFetchStatusById: (recurringWorkItemId: string) => boolean;
  getRecurringWorkItemById: (recurringWorkItemId: string) => IRecurringWorkItemInstance | undefined;
  getAllRecurringWorkItemsByProjectId: (workspaceSlug: string, projectId: string) => IRecurringWorkItemInstance[];
  getAllRecurringWorkItemIdsByProjectId: (workspaceSlug: string, projectId: string) => string[];
  isAnyRecurringWorkItemsAvailableForProject: (workspaceSlug: string, projectId: string) => boolean;
  // actions
  fetchRecurringWorkItems: (workspaceSlug: string, projectId: string) => Promise<void>;
  fetchRecurringWorkItemById: (workspaceSlug: string, projectId: string, recurringWorkItemId: string) => Promise<void>;
  createRecurringWorkItem: (
    workspaceSlug: string,
    projectId: string,
    recurringWorkItemData: Partial<TRecurringWorkItem>
  ) => Promise<TRecurringWorkItem | undefined>;
  deleteRecurringWorkItem: (workspaceSlug: string, projectId: string, recurringWorkItemId: string) => Promise<void>;
}

export class RecurringWorkItemStore implements IRecurringWorkItemStore {
  // observables
  loader: IRecurringWorkItemStore["loader"] = undefined;
  fetchStatusMap: IRecurringWorkItemStore["fetchStatusMap"] = new Map();
  recurringWorkItems: IRecurringWorkItemStore["recurringWorkItems"] = new Map();
  // root store
  private rootStore: RootStore;
  // recurring work item service
  private recurringWorkItemService: RecurringWorkItemServiceBase;

  // constructor
  constructor(rootStore: RootStore) {
    // root store
    this.rootStore = rootStore;
    // recurring work item service
    this.recurringWorkItemService = new RecurringWorkItemServiceBase();

    makeObservable(this, {
      // observables
      loader: observable,
      fetchStatusMap: observable,
      recurringWorkItems: observable,
      // computed
      isRecurringWorkItemsInitializing: computed,
    });
  }

  // computed
  /**
   * @description Whether the recurring work items are being initialized
   * @returns Whether the recurring work items are being initialized
   */
  get isRecurringWorkItemsInitializing() {
    return this.loader === "init-loader";
  }

  // computed functions
  /**
   * @description Get the fetch status of a recurring work item by its id
   * @param recurringWorkItemId - The id of the recurring work item
   * @returns The fetch status of the recurring work item
   */
  getRecurringWorkItemFetchStatusById = computedFn(
    (recurringWorkItemId: string) => this.fetchStatusMap.get(recurringWorkItemId) ?? false
  );

  /**
   * @description Get a recurring work item by its id
   * @param recurringWorkItemId - The id of the recurring work item
   * @returns The recurring work item
   */
  getRecurringWorkItemById = computedFn((recurringWorkItemId: string) =>
    this.recurringWorkItems.get(recurringWorkItemId)
  );

  /**
   * @description Get all recurring work items
   * @param workspaceSlug - The slug of the workspace
   * @returns All recurring work items
   */
  private getAllRecurringWorkItems = computedFn((workspaceSlug: string) => {
    const workspaceId = this.rootStore.workspaceRoot.getWorkspaceBySlug(workspaceSlug)?.id;
    if (!workspaceId) return [];
    return orderBy<IRecurringWorkItemInstance>(
      Array.from(this.recurringWorkItems.values()).filter(
        (recurringWorkItem) => recurringWorkItem.workspace === workspaceId
      ),
      ["created_at"],
      ["desc"]
    );
  });

  /**
   * @description Get all recurring work items by project id
   * @param workspaceSlug - The slug of the workspace
   * @param projectId - The id of the project
   * @returns All recurring work items by project id
   */
  getAllRecurringWorkItemsByProjectId = computedFn((workspaceSlug: string, projectId: string) =>
    this.getAllRecurringWorkItems(workspaceSlug).filter((recurringWorkItem) => recurringWorkItem.project === projectId)
  );

  /**
   * @description Get all recurring work item ids by project id
   * @param workspaceSlug - The slug of the workspace
   * @param projectId - The id of the project
   * @returns All recurring work item ids by project id
   */
  getAllRecurringWorkItemIdsByProjectId = computedFn((workspaceSlug: string, projectId: string) =>
    this.getAllRecurringWorkItemsByProjectId(workspaceSlug, projectId).map((recurringWorkItem) => recurringWorkItem.id)
  );

  /**
   * @description Check if any recurring work items are available for a project
   * @param workspaceSlug - The slug of the workspace
   * @param projectId - The id of the project
   * @returns True if any recurring work items are available for a project, false otherwise
   */
  isAnyRecurringWorkItemsAvailableForProject = computedFn(
    (workspaceSlug: string, projectId: string) =>
      this.getAllRecurringWorkItemsByProjectId(workspaceSlug, projectId).length > 0
  );

  // helper actions
  /**
   * @description Set a recurring work item instance in the map
   * @param recurringWorkItemId - The id of the recurring work item
   * @param recurringWorkItemInstance - The instance of the recurring work item
   */
  private setRecurringWorkItemInstance = action(
    (recurringWorkItemId: string, recurringWorkItemInstance: IRecurringWorkItemInstance) => {
      this.recurringWorkItems.set(recurringWorkItemId, recurringWorkItemInstance);
      this.fetchStatusMap.set(recurringWorkItemId, true);
    }
  );

  /**
   * @description Add or update recurring work items
   * @param recurringWorkItems - The recurring work items to add or update
   * @param updateActionCallback - The action to use to update the recurring work item
   */
  private addOrUpdateRecurringWorkItems = action(
    (recurringWorkItems: TRecurringWorkItem[], updateActionCallback: IRecurringWorkItemActionCallbacks["update"]) => {
      for (const recurringWorkItem of recurringWorkItems) {
        if (!recurringWorkItem.id) continue;

        // Update existing recurring work item if it exists
        if (this.recurringWorkItems.get(recurringWorkItem.id)) {
          this.recurringWorkItems.get(recurringWorkItem.id)?.mutateInstance(recurringWorkItem);
          continue;
        }

        // Create new recurring work item instance
        const recurringWorkItemInstance = new RecurringWorkItemInstance({
          root: this.rootStore,
          updateActionCallback,
          recurringWorkItemData: recurringWorkItem,
        });

        // Add new recurring work item instance to recurring work items
        this.setRecurringWorkItemInstance(recurringWorkItem.id, recurringWorkItemInstance);
      }
    }
  );

  // actions
  /**
   * @description Fetch all recurring work items
   * @param workspaceSlug - The workspace slug
   * @param projectId - The project id
   */
  fetchRecurringWorkItems = action(async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = "init-loader";
      // Fetch the recurring work items
      const recurringWorkItems = await this.recurringWorkItemService.list(workspaceSlug, projectId);
      this.addOrUpdateRecurringWorkItems(recurringWorkItems, (id, recurringWorkItem) =>
        // Update the recurring work item
        this.recurringWorkItemService.update(workspaceSlug, projectId, id, recurringWorkItem)
      );
      this.loader = "loaded";
    } catch (error) {
      this.loader = "loaded";
      console.error("RecurringWorkItemStore.fetchRecurringWorkItems -> error", error);
      throw error;
    }
  });

  /**
   * @description Fetch a recurring work item by id
   * @param workspaceSlug - The workspace slug
   * @param projectId - The project id
   * @param recurringWorkItemId - The recurring work item id
   */
  fetchRecurringWorkItemById = action(async (workspaceSlug: string, projectId: string, recurringWorkItemId: string) => {
    // if the recurring work item is already being fetched, return
    if (this.getRecurringWorkItemFetchStatusById(recurringWorkItemId)) return;
    this.loader = "init-loader";
    try {
      // Fetch the recurring work item
      const recurringWorkItem = await this.recurringWorkItemService.retrieve(
        workspaceSlug,
        projectId,
        recurringWorkItemId
      );
      this.addOrUpdateRecurringWorkItems([recurringWorkItem], (id, recurringWorkItem) =>
        // Update the recurring work item
        this.recurringWorkItemService.update(workspaceSlug, projectId, id, recurringWorkItem)
      );
      this.loader = "loaded";
    } catch (error) {
      this.loader = "loaded";
      console.error("RecurringWorkItemStore.fetchRecurringWorkItemById -> error", error);
      throw error;
    }
  });

  /**
   * @description Create a recurring work item
   * @param recurringWorkItemData - The data of the recurring work item
   * @param createUpdateActionCallbacks - The actions to use to create and update the recurring work item
   * @returns The created recurring work item
   */
  createRecurringWorkItem = action(
    async (workspaceSlug: string, projectId: string, recurringWorkItemData: Partial<TRecurringWorkItem>) => {
      try {
        this.loader = "mutation";
        const recurringWorkItem = await this.recurringWorkItemService.create(
          workspaceSlug,
          projectId,
          recurringWorkItemData
        );
        this.addOrUpdateRecurringWorkItems([recurringWorkItem], (id, recurringWorkItem) =>
          // Update the recurring work item
          this.recurringWorkItemService.update(workspaceSlug, projectId, id, recurringWorkItem)
        );
        this.loader = "loaded";
        return recurringWorkItem;
      } catch (error) {
        this.loader = "loaded";
        console.error("RecurringWorkItemStore.createRecurringWorkItem -> error", error);
        throw error;
      }
    }
  );

  /**
   * @description Delete a recurring work item
   * @param recurringWorkItemId - The id of the recurring work item
   * @param destroyActionCallback - The action to use to delete the recurring work item
   */
  deleteRecurringWorkItem = action(async (workspaceSlug: string, projectId: string, recurringWorkItemId: string) => {
    const recurringWorkItem = this.getRecurringWorkItemById(recurringWorkItemId);
    if (!recurringWorkItem || !recurringWorkItem.id || !recurringWorkItem.asJSON) return;
    try {
      this.loader = "mutation";
      await this.recurringWorkItemService.destroy(workspaceSlug, projectId, recurringWorkItemId);
      this.recurringWorkItems.delete(recurringWorkItemId);
      this.loader = "loaded";
    } catch (error) {
      this.loader = "loaded";
      console.error("RecurringWorkItemStore.deleteRecurringWorkItem -> error", error);
      throw error;
    }
  });
}
