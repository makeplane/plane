import { API_BASE_URL } from "@plane/constants";
import { TDocumentPayload, TPage } from "@plane/types";
import { APIService } from "@/services/api.service";

/**
 * Base context interface that all page contexts must extend
 */
export interface IPageContext {
  workspaceSlug: string;
}

/**
 * Project page context - needs both workspaceSlug and projectId
 */
export interface IProjectPageContext extends IPageContext {
  workspaceSlug: string;
  projectId: string;
}

/**
 * Generic base page service interface
 * @template TContext - The context type (workspace or project)
 */
export interface IBasePageService<TContext extends IPageContext = IPageContext> {
  // Fetching operations
  fetchAll(context: TContext): Promise<TPage[]>;
  fetchById(context: TContext, pageId: string): Promise<TPage>;
  fetchSubPages(context: TContext, pageId: string): Promise<TPage[]>;
  fetchParentPages(context: TContext, pageId: string): Promise<TPage[]>;
  fetchPagesByType(context: TContext, pageType: string, searchQuery?: string): Promise<TPage[]>;

  // CRUD operations
  create(context: TContext, pageData: Partial<TPage>): Promise<TPage>;
  update(context: TContext, pageId: string, payload: Partial<TPage>): Promise<Partial<TPage>>;
  updateDescription(context: TContext, pageId: string, document: TDocumentPayload): Promise<void>;
  remove(context: TContext, pageId: string): Promise<void>;

  // Page-specific operations
  updateAccess(context: TContext, pageId: string, payload: Pick<TPage, "access">): Promise<void>;
  lock(context: TContext, pageId: string, recursive: boolean): Promise<void>;
  unlock(context: TContext, pageId: string, recursive: boolean): Promise<void>;
  archive(context: TContext, pageId: string): Promise<{ archived_at: string }>;
  restore(context: TContext, pageId: string): Promise<void>;
  duplicate(context: TContext, pageId: string): Promise<TPage>;

  // Favorite operations
  fetchFavorites(context: TContext): Promise<TPage[]>;
  addToFavorites(context: TContext, pageId: string): Promise<void>;
  removeFromFavorites(context: TContext, pageId: string): Promise<void>;

  // Description operations
  fetchDescriptionBinary(context: TContext, pageId: string): Promise<any>;
}

/**
 * Base page service implementation with common functionality
 * Subclasses only need to implement getBasePath() and any unique methods
 */
export abstract class BasePageService<TContext extends IPageContext>
  extends APIService
  implements IBasePageService<TContext>
{
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Abstract method - subclasses must implement to define URL structure
   */
  protected abstract getBasePath(context: TContext, pageId?: string): string;

  /**
   * Abstract method - subclasses must implement to define favorite pages URL structure
   */
  protected abstract getFavoritesPath(context: TContext, pageId?: string): string;

  // ===== FETCHING OPERATIONS =====

  async fetchAll(context: TContext): Promise<TPage[]> {
    return this.get(`${this.getBasePath(context)}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchPagesByType(context: TContext, type: string, searchQuery?: string): Promise<TPage[]> {
    let url = `${this.getBasePath(context)}/?type=${type}`;
    if (searchQuery) {
      url += `&search=${searchQuery}`;
    }

    return this.get(url)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchById(context: TContext, pageId: string): Promise<TPage> {
    return this.get(`${this.getBasePath(context, pageId)}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchSubPages(context: TContext, pageId: string): Promise<TPage[]> {
    return this.get(`${this.getBasePath(context, pageId)}/sub-pages`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchParentPages(context: TContext, pageId: string): Promise<TPage[]> {
    return this.get(`${this.getBasePath(context, pageId)}/parent-pages`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // ===== CRUD OPERATIONS =====

  async create(context: TContext, data: Partial<TPage>): Promise<TPage> {
    return this.post(`${this.getBasePath(context)}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(context: TContext, pageId: string, data: Partial<TPage>): Promise<TPage> {
    return this.patch(`${this.getBasePath(context, pageId)}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateDescription(context: TContext, pageId: string, data: TDocumentPayload): Promise<any> {
    return this.patch(`${this.getBasePath(context, pageId)}/description/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error;
      });
  }

  async remove(context: TContext, pageId: string): Promise<void> {
    return this.delete(`${this.getBasePath(context, pageId)}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // ===== PAGE-SPECIFIC OPERATIONS =====

  async updateAccess(context: TContext, pageId: string, data: Pick<TPage, "access">): Promise<void> {
    return this.post(`${this.getBasePath(context, pageId)}/access/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async lock(context: TContext, pageId: string, recursive: boolean): Promise<void> {
    return this.post(`${this.getBasePath(context, pageId)}/lock/`, {
      action: recursive ? "all" : "",
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async unlock(context: TContext, pageId: string, recursive: boolean): Promise<void> {
    return this.delete(`${this.getBasePath(context, pageId)}/lock/`, {
      action: recursive ? "all" : "",
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async archive(context: TContext, pageId: string): Promise<{ archived_at: string }> {
    return this.post(`${this.getBasePath(context, pageId)}/archive/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async restore(context: TContext, pageId: string): Promise<void> {
    return this.delete(`${this.getBasePath(context, pageId)}/archive/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async duplicate(context: TContext, pageId: string): Promise<TPage> {
    return this.post(`${this.getBasePath(context, pageId)}/duplicate/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // ===== FAVORITE OPERATIONS =====

  async fetchFavorites(context: TContext): Promise<TPage[]> {
    return this.get(`${this.getFavoritesPath(context)}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addToFavorites(context: TContext, pageId: string): Promise<void> {
    return this.post(`${this.getFavoritesPath(context, pageId)}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeFromFavorites(context: TContext, pageId: string): Promise<void> {
    return this.delete(`${this.getFavoritesPath(context, pageId)}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // ===== DESCRIPTION OPERATIONS =====

  async fetchDescriptionBinary(context: TContext, pageId: string): Promise<any> {
    return this.get(`${this.getBasePath(context, pageId)}/description/`, {
      headers: {
        "Content-Type": "application/octet-stream",
      },
      responseType: "arraybuffer",
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

/**
 * Extended interface for project-specific page services
 */
export interface IProjectPageService extends IBasePageService<IProjectPageContext> {
  move(context: IProjectPageContext, pageId: string, newProjectId: string): Promise<void>;
}

/**
 * Workspace page service interface
 */
export type IWorkspacePageService = IBasePageService<IWorkspacePageContext>;
