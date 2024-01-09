import { observable, runInAction } from "mobx";
import set from "lodash/set";
import omit from "lodash/omit";
import isToday from "date-fns/isToday";
import isThisWeek from "date-fns/isThisWeek";
import isYesterday from "date-fns/isYesterday";

import { IPage } from "@plane/types";
import { PageService } from "services/page.service";
import { is } from "date-fns/locale";

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
}

export class PageStore {
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

  pageService;

  constructor(page: IPage) {
    observable(this, {
      name: observable.ref,
      description_html: observable.ref,
      is_favorite: observable.ref,
      is_locked: observable.ref,
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

  updateName = async (name: string) => {
    this.name = name;
    await this.pageService.patchPage(this.workspace, this.project, this.id, { name });
  };

  updateDescription = async (description: string) => {
    this.description = description;
    await this.pageService.patchPage(this.workspace, this.project, this.id, { description });
  };

  /**
   * Add Page to users favorites list
   * @param workspaceSlug
   * @param projectId
   * @param pageId
   */
  addToFavorites = async (workspaceSlug: string, projectId: string, pageId: string) => {
    try {
      runInAction(() => {
        this.is_favorite = true;
      });
      await this.pageService.addPageToFavorites(workspaceSlug, projectId, pageId);
    } catch (error) {
      this.is_favorite = false;
      throw error;
    }
  };

  /**
   * Remove page from the users favorites list
   * @param workspaceSlug
   * @param projectId
   * @param pageId
   */
  removeFromFavorites = async (workspaceSlug: string, projectId: string, pageId: string) => {
    try {
      this.is_favorite = false;
      await this.pageService.removePageFromFavorites(workspaceSlug, projectId, pageId);
    } catch (error) {
      this.is_favorite = true;
      throw error;
    }
  };

  /**
   * make a page public
   * @param workspaceSlug
   * @param projectId
   * @param pageId
   * @returns
   */
  makePublic = async (workspaceSlug: string, projectId: string, pageId: string) => {
    try {
      runInAction(() => {
        this.access = 0;
      });
      await this.pageService.patchPage(workspaceSlug, projectId, pageId, { access: 0 });
    } catch (error) {
      runInAction(() => {
        this.access = 1;
      });
      throw error;
    }
  };

  /**
   * Make a page private
   * @param workspaceSlug
   * @param projectId
   * @param pageId
   * @returns
   */
  makePrivate = async (workspaceSlug: string, projectId: string, pageId: string) => {
    try {
      runInAction(() => {
        this.access = 1;
      });
      await this.pageService.patchPage(workspaceSlug, projectId, pageId, { access: 1 });
    } catch (error) {
      runInAction(() => {
        this.access = 0;
      });
      throw error;
    }
  };
}
