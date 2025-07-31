import set from "lodash/set";
import unset from "lodash/unset";
import { makeObservable, observable, runInAction, action, computed } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { TPageFolder } from "@plane/types";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
// services
import { PageFolderService } from "@/services/page-folder";

type TLoader = "init-loader" | "mutation-loader" | undefined;

type TError = { title: string; description: string };

export interface IPageFolderStore {
  // observables
  loader: TLoader;
  data: Record<string, TPageFolder>; // folderId => Folder
  error: TError | undefined;
  // computed
  isAnyFolderAvailable: boolean;
  // helper actions
  getFolderById: (folderId: string) => TPageFolder | undefined;
  getFoldersByProject: (projectId: string) => TPageFolder[];
  // actions
  fetchFoldersList: (workspaceSlug: string, projectId: string) => Promise<TPageFolder[] | undefined>;
  fetchFolderDetails: (workspaceSlug: string, projectId: string, folderId: string) => Promise<TPageFolder | undefined>;
  createFolder: (folderData: Partial<TPageFolder>) => Promise<TPageFolder | undefined>;
  updateFolder: (folderId: string, folderData: Partial<TPageFolder>) => Promise<TPageFolder | undefined>;
  removeFolder: (folderId: string) => Promise<void>;
  addPageToFolder: (folderId: string, pageId: string) => Promise<void>;
  removePageFromFolder: (folderId: string, pageId: string) => Promise<void>;
}

export class PageFolderStore implements IPageFolderStore {
  // observables
  loader: TLoader = "init-loader";
  data: Record<string, TPageFolder> = {}; // folderId => Folder
  error: TError | undefined = undefined;
  // service
  service: PageFolderService;
  rootStore: RootStore;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      data: observable,
      error: observable,
      // computed
      isAnyFolderAvailable: computed,
      // helper actions
      getFolderById: action,
      getFoldersByProject: action,
      // actions
      fetchFoldersList: action,
      fetchFolderDetails: action,
      createFolder: action,
      updateFolder: action,
      removeFolder: action,
      addPageToFolder: action,
      removePageFromFolder: action,
    });
    this.rootStore = store;
    // service
    this.service = new PageFolderService();
  }

  /**
   * @description check if any folder is available
   */
  get isAnyFolderAvailable() {
    if (this.loader) return true;
    return Object.keys(this.data).length > 0;
  }

  /**
   * @description get the folder store by id
   * @param {string} folderId
   */
  getFolderById = computedFn((folderId: string) => this.data?.[folderId] || undefined);

  /**
   * @description get folders by project
   * @param {string} projectId
   */
  getFoldersByProject = computedFn((projectId: string) => {
    return Object.values(this.data).filter((folder) => folder.project_ids?.includes(projectId));
  });

  /**
   * @description fetch all the folders
   */
  fetchFoldersList = async (workspaceSlug: string, projectId: string) => {
    try {
      if (!workspaceSlug || !projectId) return undefined;

      runInAction(() => {
        this.loader = "init-loader";
        this.error = undefined;
      });

      const folders = await this.service.fetchAll(workspaceSlug, projectId);
      runInAction(() => {
        for (const folder of folders) if (folder?.id) set(this.data, [folder.id], folder);
        this.loader = undefined;
      });

      return folders;
    } catch (error) {
      runInAction(() => {
        this.loader = undefined;
        this.error = {
          title: "Failed",
          description: "Failed to fetch the folders, Please try again later.",
        };
      });
      throw error;
    }
  };

  /**
   * @description fetch the details of a folder
   * @param {string} folderId
   */
  fetchFolderDetails = async (workspaceSlug: string, projectId: string, folderId: string) => {
    try {
      if (!workspaceSlug || !projectId || !folderId) return undefined;

      runInAction(() => {
        this.loader = "init-loader";
        this.error = undefined;
      });

      const folder = await this.service.fetchById(workspaceSlug, projectId, folderId);
      runInAction(() => {
        if (folder?.id) set(this.data, [folder.id], folder);
        this.loader = undefined;
      });

      return folder;
    } catch (error) {
      runInAction(() => {
        this.loader = undefined;
        this.error = {
          title: "Failed",
          description: "Failed to fetch the folder, Please try again later.",
        };
      });
      throw error;
    }
  };

  /**
   * @description create a folder
   * @param {Partial<TPageFolder>} folderData
   */
  createFolder = async (folderData: Partial<TPageFolder>) => {
    try {
      const { workspaceSlug, projectId } = this.store.router;
      if (!workspaceSlug || !projectId) return undefined;

      runInAction(() => {
        this.loader = "mutation-loader";
        this.error = undefined;
      });

      const folder = await this.service.create(workspaceSlug, projectId, folderData);
      runInAction(() => {
        if (folder?.id) set(this.data, [folder.id], folder);
        this.loader = undefined;
      });

      return folder;
    } catch (error) {
      runInAction(() => {
        this.loader = undefined;
        this.error = {
          title: "Failed",
          description: "Failed to create a folder, Please try again later.",
        };
      });
      throw error;
    }
  };

  /**
   * @description update a folder
   * @param {string} folderId
   * @param {Partial<TPageFolder>} folderData
   */
  updateFolder = async (folderId: string, folderData: Partial<TPageFolder>) => {
    try {
      const { workspaceSlug, projectId } = this.store.router;
      if (!workspaceSlug || !projectId || !folderId) return undefined;

      runInAction(() => {
        this.loader = "mutation-loader";
        this.error = undefined;
      });

      const folder = await this.service.update(workspaceSlug, projectId, folderId, folderData);
      runInAction(() => {
        if (folder?.id) set(this.data, [folder.id], folder);
        this.loader = undefined;
      });

      return folder;
    } catch (error) {
      runInAction(() => {
        this.loader = undefined;
        this.error = {
          title: "Failed",
          description: "Failed to update the folder, Please try again later.",
        };
      });
      throw error;
    }
  };

  /**
   * @description delete a folder
   * @param {string} folderId
   */
  removeFolder = async (folderId: string) => {
    try {
      const { workspaceSlug, projectId } = this.store.router;
      if (!workspaceSlug || !projectId || !folderId) return undefined;

      await this.service.remove(workspaceSlug, projectId, folderId);
      runInAction(() => {
        unset(this.data, [folderId]);
      });
    } catch (error) {
      runInAction(() => {
        this.loader = undefined;
        this.error = {
          title: "Failed",
          description: "Failed to delete a folder, Please try again later.",
        };
      });
      throw error;
    }
  };

  /**
   * @description add a page to a folder
   * @param {string} folderId
   * @param {string} pageId
   */
  addPageToFolder = async (folderId: string, pageId: string) => {
    try {
      const { workspaceSlug, projectId } = this.store.router;
      if (!workspaceSlug || !projectId || !folderId || !pageId) return undefined;

      await this.service.addPageToFolder(workspaceSlug, projectId, folderId, pageId);
      runInAction(() => {
        const folder = this.data[folderId];
        if (folder && folder.page_ids) {
          if (!folder.page_ids.includes(pageId)) {
            folder.page_ids.push(pageId);
          }
        } else if (folder) {
          folder.page_ids = [pageId];
        }
      });
    } catch (error) {
      console.error("Failed to add page to folder", error);
      throw error;
    }
  };

  /**
   * @description remove a page from a folder
   * @param {string} folderId
   * @param {string} pageId
   */
  removePageFromFolder = async (folderId: string, pageId: string) => {
    try {
      const { workspaceSlug, projectId } = this.store.router;
      if (!workspaceSlug || !projectId || !folderId || !pageId) return undefined;

      await this.service.removePageFromFolder(workspaceSlug, projectId, folderId, pageId);
      runInAction(() => {
        const folder = this.data[folderId];
        if (folder && folder.page_ids) {
          folder.page_ids = folder.page_ids.filter((id) => id !== pageId);
        }
      });
    } catch (error) {
      console.error("Failed to remove page from folder", error);
      throw error;
    }
  };
}
