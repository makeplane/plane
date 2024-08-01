import { uniqBy } from "lodash";
import set from "lodash/set";
import { action, observable, makeObservable, runInAction } from "mobx";
import { v4 as uuidv4 } from "uuid";
import { IFavorite } from "@plane/types";
import { FavoriteService } from "@/services/favorite";

export interface IFavoriteStore {
  // observables

  favoriteIds: string[];
  favoriteMap: {
    [favoriteId: string]: IFavorite;
  };
  entityMap: {
    [entityId: string]: IFavorite;
  };
  // computed actions
  // actions
  fetchFavorite: (workspaceSlug: string) => Promise<IFavorite[]>;
  // CRUD actions
  addFavorite: (workspaceSlug: string, data: Partial<IFavorite>) => Promise<IFavorite>;
  updateFavorite: (workspaceSlug: string, favoriteId: string, data: Partial<IFavorite>) => Promise<IFavorite>;
  deleteFavorite: (workspaceSlug: string, favoriteId: string) => Promise<void>;
  getGroupedFavorites: (workspaceSlug: string, favoriteId: string) => Promise<IFavorite[]>;
  moveFavorite: (workspaceSlug: string, favoriteId: string, data: Partial<IFavorite>) => Promise<void>;
  removeFavoriteEntity: (workspaceSlug: string, entityId: string) => Promise<void>;
}

export class FavoriteStore implements IFavoriteStore {
  // observables
  favoriteIds: string[] = [];
  favoriteMap: {
    [favoriteId: string]: IFavorite;
  } = {};
  entityMap: {
    [entityId: string]: IFavorite;
  } = {};
  // service
  favoriteService;

  constructor() {
    makeObservable(this, {
      // observable
      favoriteMap: observable,
      entityMap: observable,
      favoriteIds: observable,
      // action
      fetchFavorite: action,
      // CRUD actions
      addFavorite: action,
      getGroupedFavorites: action,
      moveFavorite: action,
      removeFavoriteEntity: action,
    });
    this.favoriteService = new FavoriteService();
  }

  /**
   * Creates a favorite in the workspace and adds it to the store
   * @param workspaceSlug
   * @param data
   * @returns Promise<IFavorite>
   */
  addFavorite = async (workspaceSlug: string, data: Partial<IFavorite>) => {
    const id = uuidv4();
    data = { ...data, parent: null, is_folder: data.entity_type === "folder" };

    try {
      // optimistic addition
      runInAction(() => {
        set(this.favoriteMap, [id], data);
        data.entity_identifier && set(this.entityMap, [data.entity_identifier], data);
        this.favoriteIds = [id, ...this.favoriteIds];
      });
      const response = await this.favoriteService.addFavorite(workspaceSlug, data);

      // overwrite the temp id
      runInAction(() => {
        delete this.favoriteMap[id];
        set(this.favoriteMap, [response.id], response);
        response.entity_identifier && set(this.entityMap, [response.entity_identifier], response);
        this.favoriteIds = [response.id, ...this.favoriteIds.filter((favId) => favId !== id)];
      });
      return response;
    } catch (error) {
      delete this.favoriteMap[id];
      data.entity_identifier && delete this.entityMap[data.entity_identifier];
      this.favoriteIds = this.favoriteIds.filter((favId) => favId !== id);

      console.error("Failed to create favorite from favorite store");
      throw error;
    }
  };

  /**
   * Updates a favorite in the workspace and updates the store
   * @param workspaceSlug
   * @param favoriteId
   * @param data
   * @returns Promise<IFavorite>
   */
  updateFavorite = async (workspaceSlug: string, favoriteId: string, data: Partial<IFavorite>) => {
    try {
      const response = await this.favoriteService.updateFavorite(workspaceSlug, favoriteId, data);
      runInAction(() => {
        set(this.favoriteMap, [response.id], response);
      });
      return response;
    } catch (error) {
      console.error("Failed to update favorite from favorite store");
      throw error;
    }
  };

  /**
   * Moves a favorite in the workspace and updates the store
   * @param workspaceSlug
   * @param favoriteId
   * @param data
   * @returns Promise<void>
   */
  moveFavorite = async (workspaceSlug: string, favoriteId: string, data: Partial<IFavorite>) => {
    try {
      const response = await this.favoriteService.updateFavorite(workspaceSlug, favoriteId, data);
      runInAction(() => {
        // add the favorite to the new parent
        if (!data.parent) return;
        set(this.favoriteMap, [data.parent, "children"], [response, ...this.favoriteMap[data.parent].children]);

        // remove the favorite from the old parent
        const oldParent = this.favoriteMap[favoriteId].parent;
        if (oldParent) {
          set(
            this.favoriteMap,
            [oldParent, "children"],
            this.favoriteMap[oldParent].children.filter((child) => child.id !== favoriteId)
          );
        }

        // add parent of the favorite
        set(this.favoriteMap, [favoriteId, "parent"], data.parent);
      });
    } catch (error) {
      console.error("Failed to move favorite from favorite store");
      throw error;
    }
  };

  /**
   * Deletes a favorite from the workspace and updates the store
   * @param workspaceSlug
   * @param favoriteId
   * @returns Promise<void>
   */
  deleteFavorite = async (workspaceSlug: string, favoriteId: string) => {
    try {
      await this.favoriteService.deleteFavorite(workspaceSlug, favoriteId);
      runInAction(() => {
        const parent = this.favoriteMap[favoriteId].parent;
        if (parent) {
          set(
            this.favoriteMap,
            [parent, "children"],
            this.favoriteMap[parent].children.filter((child) => child.id !== favoriteId)
          );
        }
        delete this.favoriteMap[favoriteId];
        this.favoriteIds = this.favoriteIds.filter((id) => id !== favoriteId);
      });
    } catch (error) {
      console.error("Failed to delete favorite from favorite store");
      throw error;
    }
  };

  /**
   * Removes a favorite entity from the workspace and updates the store
   * @param workspaceSlug
   * @param entityId
   * @returns Promise<void>
   */
  removeFavoriteEntity = async (workspaceSlug: string, entityId: string) => {
    try {
      const favoriteId = this.entityMap[entityId].id;
      await this.deleteFavorite(workspaceSlug, favoriteId);
      runInAction(() => {
        delete this.entityMap[entityId];
      });
    } catch (error) {
      console.error("Failed to remove favorite entity from favorite store");
      throw error;
    }
  };
  /**
   * get Grouped Favorites
   * @param workspaceSlug
   * @param favoriteId
   * @returns Promise<IFavorite[]>
   */
  getGroupedFavorites = async (workspaceSlug: string, favoriteId: string) => {
    try {
      const response = await this.favoriteService.getGroupedFavorites(workspaceSlug, favoriteId);
      runInAction(() => {
        // add children to the favorite
        set(this.favoriteMap, [favoriteId, "children"], response);
        // add the favorites to the map
        response.forEach((favorite) => {
          set(this.favoriteMap, [favorite.id], favorite);
          this.favoriteIds.push(favorite.id);
          this.favoriteIds = uniqBy(this.favoriteIds, (id) => id);
          favorite.entity_identifier && set(this.entityMap, [favorite.entity_identifier], favorite);
        });
      });

      return response;
    } catch (error) {
      console.error("Failed to get grouped favorites from favorite store");
      throw error;
    }
  };

  /**
   * get Workspace favorite using workspace slug
   * @param workspaceSlug
   * @returns Promise<IFavorite[]>
   *
   */
  fetchFavorite = async (workspaceSlug: string) => {
    try {
      const favorites = await this.favoriteService.getFavorites(workspaceSlug);
      runInAction(() => {
        favorites.forEach((favorite) => {
          set(this.favoriteMap, [favorite.id], favorite);
          this.favoriteIds.push(favorite.id);
          favorite.entity_identifier && set(this.entityMap, [favorite.entity_identifier], favorite);
        });
      });
      return favorites;
    } catch (error) {
      console.error("Failed to fetch favorites from workspace store");
      throw error;
    }
  };
}
