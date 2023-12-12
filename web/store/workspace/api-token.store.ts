// mobx
import { action, observable, makeObservable, runInAction } from "mobx";
import { APITokenService } from "services/api_token.service";
import { RootStore } from "../root.store";
// types
import { IApiToken } from "types/api_token";

export interface IApiTokenStore {
  // states
  loader: boolean;
  error: any | null;

  // observables
  apiTokens: Record<string, IApiToken> | null;

  // computed actions
  getApiTokenById: (apiTokenId: string) => IApiToken | null;

  // actions
  fetchApiTokens: (workspaceSlug: string) => Promise<IApiToken[]>;
  fetchApiTokenDetails: (workspaceSlug: string, tokenId: string) => Promise<IApiToken>;
  createApiToken: (workspaceSlug: string, data: Partial<IApiToken>) => Promise<IApiToken>;
  deleteApiToken: (workspaceSlug: string, tokenId: string) => Promise<void>;
}

export class ApiTokenStore implements IApiTokenStore {
  // states
  loader: boolean = false;
  error: any | null = null;

  // observables
  apiTokens: Record<string, IApiToken> | null = null;

  // services
  apiTokenService;
  // root store
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // states
      loader: observable.ref,
      error: observable.ref,

      // observables
      apiTokens: observable,

      // computed actions
      getApiTokenById: action,

      // actions
      fetchApiTokens: action,
      fetchApiTokenDetails: action,
      createApiToken: action,
      deleteApiToken: action,
    });

    // services
    this.apiTokenService = new APITokenService();
    // root store
    this.rootStore = _rootStore;
  }

  /**
   * get API token by id
   * @param apiTokenId
   */
  getApiTokenById = (apiTokenId: string) => {
    if (!this.apiTokens) return null;

    return this.apiTokens[apiTokenId] || null;
  };

  /**
   * fetch all the API tokens for a workspace
   * @param workspaceSlug
   */
  fetchApiTokens = async (workspaceSlug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const response = await this.apiTokenService.getApiTokens(workspaceSlug);

      const apiTokensObject: { [apiTokenId: string]: IApiToken } = response.reduce((accumulator, currentWebhook) => {
        if (currentWebhook && currentWebhook.id) {
          return { ...accumulator, [currentWebhook.id]: currentWebhook };
        }
        return accumulator;
      }, {});

      runInAction(() => {
        this.apiTokens = apiTokensObject;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    }
  };

  /**
   * fetch API token details using token id
   * @param workspaceSlug
   * @param tokenId
   */
  fetchApiTokenDetails = async (workspaceSlug: string, tokenId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const response = await this.apiTokenService.retrieveApiToken(workspaceSlug, tokenId);

      runInAction(() => {
        this.apiTokens = { ...this.apiTokens, [response.id]: response };
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    }
  };

  /**
   * create API token using data
   * @param workspaceSlug
   * @param data
   */
  createApiToken = async (workspaceSlug: string, data: Partial<IApiToken>) => {
    try {
      this.loader = true;
      this.error = null;

      const response = await this.apiTokenService.createApiToken(workspaceSlug, data);

      runInAction(() => {
        this.apiTokens = { ...this.apiTokens, [response.id]: response };
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    }
  };

  /**
   * delete API token using token id
   * @param workspaceSlug
   * @param tokenId
   */
  deleteApiToken = async (workspaceSlug: string, tokenId: string) => {
    try {
      this.loader = true;
      this.error = null;

      await this.apiTokenService.deleteApiToken(workspaceSlug, tokenId);

      const updatedApiTokens = { ...this.apiTokens };
      delete updatedApiTokens[tokenId];

      runInAction(() => {
        this.apiTokens = updatedApiTokens;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    }
  };
}
