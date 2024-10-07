import { uniqBy } from "lodash";
import set from "lodash/set";
import { action, observable, makeObservable, runInAction, computed } from "mobx";
import { v4 as uuidv4 } from "uuid";
import { IFavorite } from "@plane/types";
import { FavoriteService } from "@/services/favorite";
import { CoreRootStore } from "./root.store";

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
  existingFolders: string[];
  groupedFavorites: { [favoriteId: string]: IFavorite };
  // actions
  fetchFavorite: (workspaceSlug: string) => Promise<IFavorite[]>;
  // CRUD actions
  addFavorite: (workspaceSlug: string, data: Partial<IFavorite>) => Promise<IFavorite>;
  updateFavorite: (workspaceSlug: string, favoriteId: string, data: Partial<IFavorite>) => Promise<IFavorite>;
  deleteFavorite: (workspaceSlug: string, favoriteId: string) => Promise<void>;
  getGroupedFavorites: (workspaceSlug: string, favoriteId: string) => Promise<IFavorite[]>;
  moveFavorite: (workspaceSlug: string, favoriteId: string, data: Partial<IFavorite>) => Promise<void>;
  removeFavoriteEntity: (workspaceSlug: string, entityId: string) => Promise<void>;
  moveFavoriteFolder: (workspaceSlug: string, favoriteId: string, data: Partial<IFavorite>) => Promise<void>;
  removeFromFavoriteFolder: (workspaceSlug: string, favoriteId: string, data: Partial<IFavorite>) => Promise<void>;
  removeFavoriteFromStore: (entity_identifier: string) => void;
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
  viewStore;
  projectStore;
  pageStore;
  cycleStore;
  moduleStore;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observable
      favoriteMap: observable,
      entityMap: observable,
      favoriteIds: observable,
      //computed
      existingFolders: computed,
      groupedFavorites: computed,
      // action
      fetchFavorite: action,
      // CRUD actions
      addFavorite: action,
      getGroupedFavorites: action,
      moveFavorite: action,
      removeFavoriteEntity: action,
      moveFavoriteFolder: action,
      removeFavoriteEntityFromStore: action,
      removeFromFavoriteFolder: action,
    });
    this.favoriteService = new FavoriteService();
    this.viewStore = _rootStore.projectView;
    this.projectStore = _rootStore.projectRoot.project;
    this.moduleStore = _rootStore.module;
    this.cycleStore = _rootStore.cycle;
    this.pageStore = _rootStore.projectPages;
  }

  get existingFolders() {
    return Object.values(this.favoriteMap).map((fav) => fav.name);
  }

  get groupedFavorites() {
    const data: { [favoriteId: string]: IFavorite } = JSON.parse(JSON.stringify(this.favoriteMap));

    Object.values(data).forEach((fav) => {
      if (fav.parent && data[fav.parent]) {
        if (data[fav.parent].children) {
          if (!data[fav.parent].children.some((f) => f.id === fav.id)) {
            data[fav.parent].children.push(fav);
          }
        } else {
          data[fav.parent].children = [fav];
        }
      }
    });
    return data;
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
    const initialState = this.favoriteMap[favoriteId];
    try {
      runInAction(() => {
        set(this.favoriteMap, [favoriteId], { ...this.favoriteMap[favoriteId], ...data });
      });
      const response = await this.favoriteService.updateFavorite(workspaceSlug, favoriteId, data);

      return response;
    } catch (error) {
      console.error("Failed to update favorite from favorite store");
      runInAction(() => {
        set(this.favoriteMap, [favoriteId], initialState);
      });
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
    const oldParent = this.favoriteMap[favoriteId].parent;
    try {
      runInAction(() => {
        // add parent of the favorite
        set(this.favoriteMap, [favoriteId, "parent"], data.parent);
      });
      await this.favoriteService.updateFavorite(workspaceSlug, favoriteId, data);
    } catch (error) {
      console.error("Failed to move favorite from favorite store");

      // revert the changes
      runInAction(() => {
        if (!data.parent) return;

        // revert the parent
        set(this.favoriteMap, [favoriteId, "parent"], oldParent);
      });
      throw error;
    }
  };

  moveFavoriteFolder = async (workspaceSlug: string, favoriteId: string, data: Partial<IFavorite>) => {
    const initialSequence = this.favoriteMap[favoriteId].sequence;
    try {
      runInAction(() => {
        set(this.favoriteMap, [favoriteId, "sequence"], data.sequence);
      });

      await this.favoriteService.updateFavorite(workspaceSlug, favoriteId, data);
    } catch (error) {
      console.error("Failed to move favorite folder");
      runInAction(() => {
        set(this.favoriteMap, [favoriteId, "sequence"], initialSequence);
        throw error;
      });
    }
  };

  removeFromFavoriteFolder = async (workspaceSlug: string, favoriteId: string, data: Partial<IFavorite>) => {
    const parent = this.favoriteMap[favoriteId].parent;
    try {
      runInAction(() => {
        //remove parent
        set(this.favoriteMap, [favoriteId, "parent"], null);
      });
      await this.favoriteService.updateFavorite(workspaceSlug, favoriteId, data);
    } catch (error) {
      console.error("Failed to move favorite");
      runInAction(() => {
        set(this.favoriteMap, [favoriteId, "parent"], parent);

        throw error;
      });
      throw error;
    }
  };

  removeFavoriteEntityFromStore = (entity_identifier: string, entity_type: string) => {
    switch (entity_type) {
      case "view":
        return (
          this.viewStore.viewMap[entity_identifier] && (this.viewStore.viewMap[entity_identifier].is_favorite = false)
        );
      case "module":
        return (
          this.moduleStore.moduleMap[entity_identifier] &&
          (this.moduleStore.moduleMap[entity_identifier].is_favorite = false)
        );
      case "page":
        return this.pageStore.data[entity_identifier] && (this.pageStore.data[entity_identifier].is_favorite = false);
      case "cycle":
        return (
          this.cycleStore.cycleMap[entity_identifier] &&
          (this.cycleStore.cycleMap[entity_identifier].is_favorite = false)
        );
      case "project":
        return (
          this.projectStore.projectMap[entity_identifier] &&
          (this.projectStore.projectMap[entity_identifier].is_favorite = false)
        );
      default:
        return;
    }
  };

  /**
   * Deletes a favorite from the workspace and updates the store
   * @param workspaceSlug
   * @param favoriteId
   * @returns Promise<void>
   */
  deleteFavorite = async (workspaceSlug: string, favoriteId: string) => {
    const parent = this.favoriteMap[favoriteId].parent;
    const children = this.groupedFavorites[favoriteId].children;
    const entity_identifier = this.favoriteMap[favoriteId].entity_identifier;
    const initialState = this.favoriteMap[favoriteId];

    try {
      await this.favoriteService.deleteFavorite(workspaceSlug, favoriteId);
      runInAction(() => {
        delete this.favoriteMap[favoriteId];
        entity_identifier && delete this.entityMap[entity_identifier];
        this.favoriteIds = this.favoriteIds.filter((id) => id !== favoriteId);
      });
      runInAction(() => {
        entity_identifier && this.removeFavoriteEntityFromStore(entity_identifier, initialState.entity_type);
        if (children) {
          children.forEach((child) => {
            if (!child.entity_identifier) return;
            this.removeFavoriteEntityFromStore(child.entity_identifier, child.entity_type);
          });
        }
      });
    } catch (error) {
      console.error("Failed to delete favorite from favorite store", error);
      runInAction(() => {
        if (parent) set(this.favoriteMap, [parent, "children"], [...this.favoriteMap[parent].children, initialState]);
        set(this.favoriteMap, [favoriteId], initialState);
        entity_identifier && set(this.entityMap, [entity_identifier], initialState);
        this.favoriteIds = [favoriteId, ...this.favoriteIds];
      });
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
    const initialState = this.entityMap[entityId];
    try {
      const favoriteId = this.entityMap[entityId].id;
      await this.deleteFavorite(workspaceSlug, favoriteId);
    } catch (error) {
      console.error("Failed to remove favorite entity from favorite store", error);
      runInAction(() => {
        set(this.entityMap, [entityId], initialState);
      });
      throw error;
    }
  };

  removeFavoriteFromStore = (entity_identifier: string) => {
    try {
      const favoriteId = this.entityMap[entity_identifier]?.id;
      const oldData = this.favoriteMap[favoriteId];
      const projectData = Object.values(this.favoriteMap).filter(
        (fav) => fav.project_id === entity_identifier && fav.entity_type !== "project"
      );
      runInAction(() => {
        projectData &&
          projectData.forEach(async (fav) => {
            this.removeFavoriteFromStore(fav.entity_identifier!);
            this.removeFavoriteEntityFromStore(fav.entity_identifier!, fav.entity_type);
          });

        if (!favoriteId) return;
        delete this.favoriteMap[favoriteId];
        this.removeFavoriteEntityFromStore(entity_identifier!, oldData.entity_type);

        delete this.entityMap[entity_identifier];
        this.favoriteIds = this.favoriteIds.filter((id) => id !== favoriteId);
      });
    } catch (error) {
      console.error("Failed to remove favorite from favorite store", error);
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
    if (!favoriteId) return [];
    try {
      const response = await this.favoriteService.getGroupedFavorites(workspaceSlug, favoriteId);
      runInAction(() => {
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
      this.favoriteIds = [];
      this.favoriteMap = {};
      this.entityMap = {};
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
