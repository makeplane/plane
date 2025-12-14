import { action, computed, makeObservable, observable, runInAction } from "mobx";
// types
import type { IBacklogItem, IBacklogItemFormData, IBacklogReorderPayload } from "@plane/types";
// services
import { BacklogService } from "@plane/services";
// store
import type { CoreRootStore } from "./root.store";

export interface IBacklogStore {
  // loaders
  loader: boolean;
  // observables
  fetchedMap: Record<string, boolean>;
  backlogItemMap: Record<string, IBacklogItem>;
  // computed
  getBacklogItemsByFamily: (familyId: string) => IBacklogItem[];
  getBacklogItemById: (itemId: string) => IBacklogItem | null;
  // actions
  // fetch
  fetchBacklogItems: (familyId: string, params?: { category?: string; status?: string }) => Promise<IBacklogItem[]>;
  fetchBacklogItem: (familyId: string, itemId: string) => Promise<IBacklogItem>;
  // crud
  createBacklogItem: (familyId: string, data: IBacklogItemFormData) => Promise<IBacklogItem>;
  updateBacklogItem: (familyId: string, itemId: string, data: Partial<IBacklogItemFormData>) => Promise<IBacklogItem>;
  deleteBacklogItem: (familyId: string, itemId: string) => Promise<void>;
  reorderBacklogItems: (familyId: string, data: IBacklogReorderPayload) => Promise<void>;
}

export class BacklogStore implements IBacklogStore {
  // observables
  loader: boolean = false;
  backlogItemMap: Record<string, IBacklogItem> = {};
  // loaders
  fetchedMap: Record<string, boolean> = {};
  // root store
  rootStore: CoreRootStore;
  // services
  backlogService: BacklogService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      backlogItemMap: observable,
      fetchedMap: observable,
      // actions
      fetchBacklogItems: action,
      fetchBacklogItem: action,
      createBacklogItem: action,
      updateBacklogItem: action,
      deleteBacklogItem: action,
      reorderBacklogItems: action,
    });

    this.rootStore = _rootStore;
    this.backlogService = new BacklogService();
  }

  /**
   * Get backlog items for a specific family
   */
  getBacklogItemsByFamily = (familyId: string): IBacklogItem[] => {
    return Object.values(this.backlogItemMap).filter((item) => item.family === familyId);
  };

  /**
   * Get backlog item by ID
   */
  getBacklogItemById = (itemId: string): IBacklogItem | null => {
    return this.backlogItemMap[itemId] || null;
  };

  /**
   * Fetch all backlog items for a family
   */
  fetchBacklogItems = async (
    familyId: string,
    params?: { category?: string; status?: string }
  ): Promise<IBacklogItem[]> => {
    try {
      runInAction(() => {
        this.loader = true;
      });

      const response = await this.backlogService.getBacklog(familyId, params);

      runInAction(() => {
        response.forEach((item) => {
          this.backlogItemMap[item.id] = item;
        });
        this.fetchedMap[familyId] = true;
        this.loader = false;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
      });
      throw error;
    }
  };

  /**
   * Fetch a single backlog item
   */
  fetchBacklogItem = async (familyId: string, itemId: string): Promise<IBacklogItem> => {
    try {
      const response = await this.backlogService.getItem(familyId, itemId);

      runInAction(() => {
        this.backlogItemMap[itemId] = response;
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Create a new backlog item
   */
  createBacklogItem = async (familyId: string, data: IBacklogItemFormData): Promise<IBacklogItem> => {
    try {
      const response = await this.backlogService.createItem(familyId, data);

      runInAction(() => {
        this.backlogItemMap[response.id] = response;
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Update an existing backlog item
   */
  updateBacklogItem = async (
    familyId: string,
    itemId: string,
    data: Partial<IBacklogItemFormData>
  ): Promise<IBacklogItem> => {
    try {
      const response = await this.backlogService.updateItem(familyId, itemId, data);

      runInAction(() => {
        this.backlogItemMap[itemId] = response;
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Delete a backlog item
   */
  deleteBacklogItem = async (familyId: string, itemId: string): Promise<void> => {
    try {
      await this.backlogService.deleteItem(familyId, itemId);

      runInAction(() => {
        delete this.backlogItemMap[itemId];
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Reorder backlog items by priority
   */
  reorderBacklogItems = async (familyId: string, data: IBacklogReorderPayload): Promise<void> => {
    try {
      await this.backlogService.reorderItems(familyId, data);

      // Refetch to get updated priorities
      await this.fetchBacklogItems(familyId);
    } catch (error) {
      throw error;
    }
  };
}

