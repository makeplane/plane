import { action, makeObservable, observable, runInAction } from "mobx";

import { IPage } from "@plane/types";
import { PageService } from "services/page.service";

export interface IPageStore {
  access: number;
  archived_at: string | null;
  color: string;
  created_at: Date;
  created_by: string;
  description: string;
  description_html: string;
  description_stripped: string | null;
  id: string;
  is_favorite: boolean;
  is_locked: boolean;
  labels: string[];
  name: string;
  owned_by: string;
  project: string;
  updated_at: Date;
  updated_by: string;
  workspace: string;
  makePublic: () => Promise<void>;
  makePrivate: () => Promise<void>;
  addToFavorites: () => Promise<void>;
  removeFromFavorites: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updateDescription: (description: string) => Promise<void>;
}

export class PageStore implements IPageStore {
  access: number = 0;
  archived_at: string | null;
  color: string;
  created_at: Date;
  created_by: string;
  description: string;
  description_html: string = "";
  description_stripped: string | null;
  id: string;
  is_favorite: boolean = false;
  is_locked: boolean = true;
  labels: string[];
  name: string = "";
  owned_by: string;
  project: string;
  updated_at: Date;
  updated_by: string;
  workspace: string;

  pageService;

  constructor(page: IPage) {
    makeObservable(this, {
      name: observable.ref,
      description_html: observable.ref,
      is_favorite: observable.ref,
      is_locked: observable.ref,
      access: observable.ref,

      makePublic: action,
      makePrivate: action,
      addToFavorites: action,
      removeFromFavorites: action,
      updateName: action,
      updateDescription: action,
    });
    this.created_by = page?.created_by || "";
    this.created_at = page?.created_at || new Date();
    this.color = page?.color || "";
    this.archived_at = page?.archived_at || null;
    this.name = page?.name || "";
    this.description = page?.description || "";
    this.description_stripped = page?.description_stripped || "";
    this.description_html = page?.description_html || "";
    this.access = page?.access || 0;
    this.workspace = page?.workspace || "";
    this.updated_by = page?.updated_by || "";
    this.updated_at = page?.updated_at || new Date();
    this.project = page?.project || "";
    this.owned_by = page?.owned_by || "";
    this.labels = page?.labels || [];
    this.is_locked = page?.is_locked || false;
    this.id = page?.id || "";
    this.is_favorite = page?.is_favorite || false;

    this.pageService = new PageService();
  }

  updateName = action("updateName", async (name: string) => {
    const oldName = this.name;
    this.name = name;
    this.pageService.patchPage(this.workspace, this.project, this.id, { name }).catch(() => {
      runInAction(() => {
        this.name = oldName;
      });
    });
  });

  updateDescription = action("updateDescription", async (description: string) => {
    this.description = description;
    await this.pageService.patchPage(this.workspace, this.project, this.id, { description });
  });

  /**
   * Add Page to users favorites list
   */
  addToFavorites = action("addToFavorites", async () => {
    this.is_favorite = true;
    this.pageService.addPageToFavorites(this.workspace, this.project, this.id).catch(() => {
      runInAction(() => {
        this.is_favorite = false;
      });
    });
  });

  /**
   * Remove page from the users favorites list
   */
  removeFromFavorites = action("removeFromFavorites", async () => {
    this.is_favorite = false;
    this.pageService.removePageFromFavorites(this.workspace, this.project, this.id).catch(() => {
      runInAction(() => {
        this.is_favorite = true;
      });
    });
  });

  /**
   * make a page public
   * @returns
   */
  makePublic = action("makePublic", async () => {
    this.access = 0;
    this.pageService.patchPage(this.workspace, this.project, this.id, { access: 0 }).catch(() => {
      runInAction(() => {
        this.access = 1;
      });
    });
  });

  /**
   * Make a page private
   * @returns
   */
  makePrivate = action("makePrivate", async () => {
    this.access = 1;
    this.pageService.patchPage(this.workspace, this.project, this.id, { access: 1 }).catch(() => {
      runInAction(() => {
        this.access = 0;
      });
    });
  });
}
