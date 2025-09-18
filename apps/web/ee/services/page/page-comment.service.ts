// constants
import { API_BASE_URL } from "@plane/constants";
// types
import { TPageComment, TPageCommentReaction } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export type IBaseCommentParams<TConfig extends Record<string, string> = Record<string, string>> = {
  pageId: string;
  config: TConfig;
};

export type ICommentParams<TConfig extends Record<string, string> = Record<string, string>> =
  IBaseCommentParams<TConfig> & {
    commentId: string;
  };

export type IReactionParams<TConfig extends Record<string, string> = Record<string, string>> =
  ICommentParams<TConfig> & {
    reaction: string;
  };

export interface IPageCommentService {
  // Comments
  list<TConfig extends Record<string, string>>(params: IBaseCommentParams<TConfig>): Promise<TPageComment[]>;
  retrieve<TConfig extends Record<string, string>>(params: ICommentParams<TConfig>): Promise<TPageComment>;
  retrieveThread<TConfig extends Record<string, string>>(params: ICommentParams<TConfig>): Promise<TPageComment[]>;
  create<TConfig extends Record<string, string>>(
    params: IBaseCommentParams<TConfig> & { data: Partial<TPageComment> }
  ): Promise<TPageComment>;
  update<TConfig extends Record<string, string>>(
    params: ICommentParams<TConfig> & { data: Partial<TPageComment> }
  ): Promise<TPageComment>;
  destroy<TConfig extends Record<string, string>>(params: ICommentParams<TConfig>): Promise<void>;
  restore<TConfig extends Record<string, string>>(params: ICommentParams<TConfig>): Promise<void>;
  resolve<TConfig extends Record<string, string>>(params: ICommentParams<TConfig>): Promise<void>;
  unresolve<TConfig extends Record<string, string>>(params: ICommentParams<TConfig>): Promise<void>;
  // Reactions
  addReaction<TConfig extends Record<string, string>>(params: IReactionParams<TConfig>): Promise<TPageCommentReaction>;
  removeReaction<TConfig extends Record<string, string>>(params: IReactionParams<TConfig>): Promise<void>;
}

export abstract class BasePageCommentService extends APIService implements IPageCommentService {
  constructor() {
    super(API_BASE_URL);
  }

  protected abstract getBasePath(params: { pageId: string; config: Record<string, string> }): string;

  /**
   * Retrieves the list of comments for a specific page
   * @param {IBaseCommentParams<TConfig>} params - Object containing pageId and config
   * @returns {Promise<TPageComment[]>} Promise resolving to comments data
   * @throws {Error} If the API request fails
   */
  async list<TConfig extends Record<string, string>>(params: IBaseCommentParams<TConfig>): Promise<TPageComment[]> {
    return this.get(`${this.getBasePath(params)}/comments/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves detailed information about a specific comment
   * @param {ICommentParams<TConfig>} params - Object containing pageId, commentId, and config
   * @returns {Promise<TPageComment>} Promise resolving to comment details
   * @throws {Error} If the API request fails
   */
  async retrieve<TConfig extends Record<string, string>>(params: ICommentParams<TConfig>): Promise<TPageComment> {
    const { commentId } = params;
    return this.get(`${this.getBasePath(params)}/comments/${commentId}/`)
      .then((response) => response?.data[0])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves all replies for a specific comment thread
   * @param {ICommentParams<TConfig>} params - Object containing pageId, commentId, and config
   * @returns {Promise<TPageComment[]>} Promise resolving to thread replies data
   * @throws {Error} If the API request fails
   */
  async retrieveThread<TConfig extends Record<string, string>>(
    params: ICommentParams<TConfig>
  ): Promise<TPageComment[]> {
    const { commentId } = params;
    return this.get(`${this.getBasePath(params)}/comments/${commentId}/replies`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new comment on a page
   * @param {IBaseCommentParams<TConfig> & { data: Partial<TPageComment> }} params - Object containing pageId, config, and comment data
   * @returns {Promise<TPageComment>} Promise resolving to the created comment data
   * @throws {Error} If the API request fails
   */
  async create<TConfig extends Record<string, string>>(
    params: IBaseCommentParams<TConfig> & { data: Partial<TPageComment> }
  ): Promise<TPageComment> {
    const { data } = params;
    return this.post(`${this.getBasePath(params)}/comments/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates a specific comment on a page
   * @param {ICommentParams<TConfig> & { data: Partial<TPageComment> }} params - Object containing pageId, commentId, config, and update data
   * @returns {Promise<TPageComment>} Promise resolving to the updated comment data
   * @throws {Error} If the API request fails
   */
  async update<TConfig extends Record<string, string>>(
    params: ICommentParams<TConfig> & { data: Partial<TPageComment> }
  ): Promise<TPageComment> {
    const { commentId, data } = params;
    return this.patch(`${this.getBasePath(params)}/comments/${commentId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Removes a specific comment from a page
   * @param {ICommentParams<TConfig>} params - Object containing pageId, commentId, and config
   * @throws {Error} If the API request fails
   */
  async destroy<TConfig extends Record<string, string>>(params: ICommentParams<TConfig>): Promise<void> {
    const { commentId } = params;
    return this.delete(`${this.getBasePath(params)}/comments/${commentId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Restores a previously deleted comment
   * @param {ICommentParams<TConfig>} params - Object containing pageId, commentId, and config
   * @throws {Error} If the API request fails
   */
  async restore<TConfig extends Record<string, string>>(params: ICommentParams<TConfig>): Promise<void> {
    const { commentId } = params;
    return this.post(`${this.getBasePath(params)}/comments/${commentId}/restore/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Marks a comment as resolved
   * @param {ICommentParams<TConfig>} params - Object containing pageId, commentId, and config
   * @throws {Error} If the API request fails
   */
  async resolve<TConfig extends Record<string, string>>(params: ICommentParams<TConfig>): Promise<void> {
    const { commentId } = params;
    return this.post(`${this.getBasePath(params)}/comments/${commentId}/resolve/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Marks a comment as unresolved
   * @param {ICommentParams<TConfig>} params - Object containing pageId, commentId, and config
   * @throws {Error} If the API request fails
   */
  async unresolve<TConfig extends Record<string, string>>(params: ICommentParams<TConfig>): Promise<void> {
    const { commentId } = params;
    return this.post(`${this.getBasePath(params)}/comments/${commentId}/un-resolve/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Adds a reaction to a specific comment
   * @param {IReactionParams<TConfig>} params - Object containing pageId, commentId, reaction, and config
   * @returns {Promise<TPageCommentReaction>} Promise resolving to the created reaction data
   * @throws {Error} If the API request fails
   */
  async addReaction<TConfig extends Record<string, string>>(
    params: IReactionParams<TConfig>
  ): Promise<TPageCommentReaction> {
    const { commentId, reaction } = params;
    return this.post(`${this.getBasePath(params)}/comments/${commentId}/reactions/`, { reaction })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Removes a reaction from a specific comment
   * @param {IReactionParams<TConfig>} params - Object containing pageId, commentId, reaction, and config
   * @throws {Error} If the API request fails
   */
  async removeReaction<TConfig extends Record<string, string>>(params: IReactionParams<TConfig>): Promise<void> {
    const { commentId, reaction } = params;
    return this.delete(`${this.getBasePath(params)}/comments/${commentId}/reactions/${reaction}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

/**
 * Standard page comment service for workspace-based pages
 * Handles comments for pages within a specific workspace context
 */
export class PageCommentService extends BasePageCommentService {
  /**
   * Generates the base API path for workspace page comments
   * @param {Object} params - Parameters for path generation
   * @param {string} params.pageId - The unique identifier for the page
   * @param {Object} params.config - Configuration object
   * @param {string} params.config.workspaceSlug - The unique identifier for the workspace
   * @returns {string} The base API path for the page comments
   */
  protected getBasePath(params: { pageId: string; config: { workspaceSlug: string } }): string {
    const { pageId, config } = params;
    const { workspaceSlug } = config;
    return `/api/workspaces/${workspaceSlug}/pages/${pageId}`;
  }
}

/**
 * Configurable page comment service for custom implementations
 * Allows for flexible base path generation through dependency injection
 */
export class ConfigurablePageCommentService extends BasePageCommentService {
  /**
   * Creates an instance of ConfigurablePageCommentService
   * @param {Function} getBasePathFn - Function that generates the base API path
   */
  constructor(private getBasePathFn: (params: { pageId: string; config: Record<string, string> }) => string) {
    super();
  }

  /**
   * Generates the base API path using the injected function
   * @param {Object} params - Parameters for path generation
   * @param {string} params.pageId - The unique identifier for the page
   * @param {Record<string, string>} params.config - Configuration object with custom properties
   * @returns {string} The base API path for the page comments
   */
  protected getBasePath(params: { pageId: string; config: Record<string, string> }): string {
    const { pageId, config } = params;
    return this.getBasePathFn({ pageId, config });
  }
}
