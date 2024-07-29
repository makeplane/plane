import { uniqBy } from "lodash";
import set from "lodash/set";
import { action, observable, makeObservable, runInAction } from "mobx";
import { IFavourite } from "@plane/types";
import { FavouriteService } from "@/services/favourite";

export interface IFavouriteStore {
  // observables

  favouriteIds: string[];
  favouriteMap: {
    [favouriteId: string]: IFavourite;
  };
  entityMap: {
    [entityId: string]: IFavourite;
  };
  // computed actions
  // actions
  fetchFavourite: (workspaceSlug: string) => Promise<IFavourite[]>;
  // CRUD actions
  addFavourite: (workspaceSlug: string, data: Partial<IFavourite>) => Promise<IFavourite>;
  updateFavourite: (workspaceSlug: string, favouriteId: string, data: Partial<IFavourite>) => Promise<IFavourite>;
  deleteFavourite: (workspaceSlug: string, favouriteId: string) => Promise<void>;
  getGroupedFavourites: (workspaceSlug: string, favouriteId: string) => Promise<IFavourite[]>;
  moveFavourite: (workspaceSlug: string, favouriteId: string, data: Partial<IFavourite>) => Promise<void>;
  removeFavouriteEntity: (workspaceSlug: string, entityId: string) => Promise<void>;
}

export class FavouriteStore implements IFavouriteStore {
  // observables
  favouriteIds: string[] = [];
  favouriteMap: {
    [favouriteId: string]: IFavourite;
  } = {};
  entityMap: {
    [entityId: string]: IFavourite;
  } = {};
  // service
  favouriteService;

  constructor() {
    makeObservable(this, {
      // observable
      favouriteMap: observable,
      entityMap: observable,
      favouriteIds: observable,
      // action
      fetchFavourite: action,
      // CRUD actions
      addFavourite: action,
      getGroupedFavourites: action,
      moveFavourite: action,
      removeFavouriteEntity: action,
    });
    this.favouriteService = new FavouriteService();
  }

  /**
   * Creates a favourite in the workspace and adds it to the store
   * @param workspaceSlug
   * @param data
   * @returns Promise<IFavourite>
   */
  addFavourite = async (workspaceSlug: string, data: Partial<IFavourite>) => {
    try {
      data = { ...data, parent: null, is_folder: data.entity_type === "folder" };
      const response = await this.favouriteService.addFavourite(workspaceSlug, data);
      runInAction(() => {
        set(this.favouriteMap, [response.id], response);
        response.entity_identifier && set(this.entityMap, [response.entity_identifier], response);
        this.favouriteIds = [response.id, ...this.favouriteIds];
      });
      return response;
    } catch (error) {
      console.log("Failed to create favourite from favourite store");
      throw error;
    }
  };

  /**
   * Updates a favourite in the workspace and updates the store
   * @param workspaceSlug
   * @param favouriteId
   * @param data
   * @returns Promise<IFavourite>
   */
  updateFavourite = async (workspaceSlug: string, favouriteId: string, data: Partial<IFavourite>) => {
    try {
      const response = await this.favouriteService.updateFavourite(workspaceSlug, favouriteId, data);
      runInAction(() => {
        set(this.favouriteMap, [response.id], response);
      });
      return response;
    } catch (error) {
      console.log("Failed to update favourite from favourite store");
      throw error;
    }
  };

  /**
   * Moves a favourite in the workspace and updates the store
   * @param workspaceSlug
   * @param favouriteId
   * @param data
   * @returns Promise<void>
   */
  moveFavourite = async (workspaceSlug: string, favouriteId: string, data: Partial<IFavourite>) => {
    try {
      const response = await this.favouriteService.updateFavourite(workspaceSlug, favouriteId, data);
      runInAction(() => {
        // add the favourite to the new parent
        if (!data.parent) return;
        set(this.favouriteMap, [data.parent], {
          ...this.favouriteMap[data.parent],
          children: [response, ...this.favouriteMap[data.parent].children],
        });

        // remove the favourite from the old parent
        const oldParent = this.favouriteMap[favouriteId].parent;
        if (oldParent) {
          set(this.favouriteMap, [oldParent], {
            ...this.favouriteMap[oldParent],
            children: this.favouriteMap[oldParent].children.filter((child) => child.id !== favouriteId),
          });
        }

        // add parent of the favourite
        set(this.favouriteMap, [favouriteId], {
          ...this.favouriteMap[favouriteId],
          parent: data.parent,
        });
      });
    } catch (error) {
      console.log("Failed to move favourite from favourite store");
      throw error;
    }
  };

  /**
   * Deletes a favourite from the workspace and updates the store
   * @param workspaceSlug
   * @param favouriteId
   * @returns Promise<void>
   */
  deleteFavourite = async (workspaceSlug: string, favouriteId: string) => {
    try {
      await this.favouriteService.deleteFavourite(workspaceSlug, favouriteId);
      runInAction(() => {
        const parent = this.favouriteMap[favouriteId].parent;
        if (parent) {
          set(this.favouriteMap, [parent], {
            ...this.favouriteMap[parent],
            children: this.favouriteMap[parent].children.filter((child) => child.id !== favouriteId),
          });
        }
        delete this.favouriteMap[favouriteId];
        this.favouriteIds = this.favouriteIds.filter((id) => id !== favouriteId);
      });
    } catch (error) {
      console.log("Failed to delete favourite from favourite store");
      throw error;
    }
  };

  /**
   * Removes a favourite entity from the workspace and updates the store
   * @param workspaceSlug
   * @param entityId
   * @returns Promise<void>
   */
  removeFavouriteEntity = async (workspaceSlug: string, entityId: string) => {
    try {
      const favouriteId = this.entityMap[entityId].id;
      await this.deleteFavourite(workspaceSlug, favouriteId);
      runInAction(() => {
        delete this.entityMap[entityId];
      });
    } catch (error) {
      console.log("Failed to remove favourite entity from favourite store");
      throw error;
    }
  };
  /**
   * get Grouped Favourites
   * @param workspaceSlug
   * @param favouriteId
   * @returns Promise<IFavourite[]>
   */
  getGroupedFavourites = async (workspaceSlug: string, favouriteId: string) => {
    try {
      const response = await this.favouriteService.getGroupedFavourites(workspaceSlug, favouriteId);
      runInAction(() => {
        // add children to the favourite
        set(this.favouriteMap, [favouriteId], { ...this.favouriteMap[favouriteId], children: response });
        // add the favourites to the map
        response.forEach((favorite) => {
          set(this.favouriteMap, [favorite.id], favorite);
          this.favouriteIds.push(favorite.id);
          this.favouriteIds = uniqBy(this.favouriteIds, (id) => id);
          favorite.entity_identifier && set(this.entityMap, [favorite.entity_identifier], favorite);
        });
      });

      return response;
    } catch (error) {
      console.log("Failed to get grouped favourites from favourite store");
      throw error;
    }
  };

  /**
   * get Workspace favourite using workspace slug
   * @param workspaceSlug
   * @returns Promise<IFavourite[]>
   *
   */
  fetchFavourite = async (workspaceSlug: string) => {
    try {
      const favourites = await this.favouriteService.getFavourites(workspaceSlug);
      runInAction(() => {
        favourites.forEach((favourite) => {
          set(this.favouriteMap, [favourite.id], favourite);
          this.favouriteIds.push(favourite.id);
          favourite.entity_identifier && set(this.entityMap, [favourite.entity_identifier], favourite);
        });
      });
      return favourites;
    } catch (error) {
      console.log("Failed to fetch favourites from workspace store");
      throw error;
    }
  };
}
