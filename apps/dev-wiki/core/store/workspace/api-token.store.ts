import { action, observable, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { IApiToken } from "@plane/types";
// services
import { APITokenService } from "@/services/api_token.service";
// store
import { CoreRootStore } from "../root.store";

export interface IApiTokenStore {
  // observables
  apiTokens: Record<string, IApiToken> | null;
  // computed actions
  getApiTokenById: (apiTokenId: string) => IApiToken | null;
  // fetch actions
  fetchApiTokens: (workspaceSlug: string) => Promise<IApiToken[]>;
  fetchApiTokenDetails: (workspaceSlug: string, tokenId: string) => Promise<IApiToken>;
  // crud actions
  createApiToken: (workspaceSlug: string, data: Partial<IApiToken>) => Promise<IApiToken>;
  deleteApiToken: (workspaceSlug: string, tokenId: string) => Promise<void>;
}

export class ApiTokenStore implements IApiTokenStore {
  // observables
  apiTokens: Record<string, IApiToken> | null = null;
  // services
  apiTokenService;
  // root store
  rootStore;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      apiTokens: observable,
      // fetch actions
      fetchApiTokens: action,
      fetchApiTokenDetails: action,
      // CRUD actions
      createApiToken: action,
      deleteApiToken: action,
    });
    // root store
    this.rootStore = _rootStore;
    // services
    this.apiTokenService = new APITokenService();
  }

  /**
   * get API token by id
   * @param apiTokenId
   */
  getApiTokenById = computedFn((apiTokenId: string) => {
    if (!this.apiTokens) return null;
    return this.apiTokens[apiTokenId] || null;
  });

  /**
   * fetch all the API tokens for a workspace
   * @param workspaceSlug
   */
  fetchApiTokens = async (workspaceSlug: string) =>
    await this.apiTokenService.getApiTokens(workspaceSlug).then((response) => {
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
    });

  /**
   * fetch API token details using token id
   * @param workspaceSlug
   * @param tokenId
   */
  fetchApiTokenDetails = async (workspaceSlug: string, tokenId: string) =>
    await this.apiTokenService.retrieveApiToken(workspaceSlug, tokenId).then((response) => {
      runInAction(() => {
        this.apiTokens = { ...this.apiTokens, [response.id]: response };
      });
      return response;
    });

  /**
   * create API token using data
   * @param workspaceSlug
   * @param data
   */
  createApiToken = async (workspaceSlug: string, data: Partial<IApiToken>) =>
    await this.apiTokenService.createApiToken(workspaceSlug, data).then((response) => {
      runInAction(() => {
        this.apiTokens = { ...this.apiTokens, [response.id]: response };
      });
      return response;
    });

  /**
   * delete API token using token id
   * @param workspaceSlug
   * @param tokenId
   */
  deleteApiToken = async (workspaceSlug: string, tokenId: string) =>
    await this.apiTokenService.deleteApiToken(workspaceSlug, tokenId).then(() => {
      const updatedApiTokens = { ...this.apiTokens };
      delete updatedApiTokens[tokenId];
      runInAction(() => {
        this.apiTokens = updatedApiTokens;
      });
    });
}
