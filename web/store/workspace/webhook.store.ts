// mobx
import { action, observable, makeObservable, computed, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { IWebhook } from "@plane/types";
import { WebhookService } from "services/webhook.service";
import { RootStore } from "../root.store";

export interface IWebhookStore {
  // observables
  webhooks: Record<string, IWebhook> | null;
  webhookSecretKey: string | null;
  // computed
  currentWebhook: IWebhook | null;
  // computed actions
  getWebhookById: (webhookId: string) => IWebhook | null;
  // fetch actions
  fetchWebhooks: (workspaceSlug: string) => Promise<IWebhook[]>;
  fetchWebhookById: (workspaceSlug: string, webhookId: string) => Promise<IWebhook>;
  // crud actions
  createWebhook: (
    workspaceSlug: string,
    data: Partial<IWebhook>
  ) => Promise<{ webHook: IWebhook; secretKey: string | null }>;
  updateWebhook: (workspaceSlug: string, webhookId: string, data: Partial<IWebhook>) => Promise<IWebhook>;
  removeWebhook: (workspaceSlug: string, webhookId: string) => Promise<void>;
  // secret key actions
  regenerateSecretKey: (
    workspaceSlug: string,
    webhookId: string
  ) => Promise<{ webHook: IWebhook; secretKey: string | null }>;
  clearSecretKey: () => void;
}

export class WebhookStore implements IWebhookStore {
  // observables
  webhooks: Record<string, IWebhook> | null = null;
  webhookSecretKey: string | null = null;
  // services
  webhookService;
  // root store
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      webhooks: observable,
      webhookSecretKey: observable.ref,
      // computed
      currentWebhook: computed,
      // fetch actions
      fetchWebhooks: action,
      fetchWebhookById: action,
      // CRUD actions
      createWebhook: action,
      updateWebhook: action,
      removeWebhook: action,
      // secret key actions
      regenerateSecretKey: action,
      clearSecretKey: action,
    });

    // services
    this.webhookService = new WebhookService();
    // root store
    this.rootStore = _rootStore;
  }

  /**
   * computed value of current webhook based on webhook id saved in the query store
   */
  get currentWebhook() {
    const webhookId = this.rootStore.app.router.webhookId;
    if (!webhookId) return null;
    const currentWebhook = this.webhooks?.[webhookId] ?? null;
    return currentWebhook;
  }

  /**
   * get webhook info from the object of webhooks in the store using webhook id
   * @param webhookId
   */
  getWebhookById = computedFn((webhookId: string) => this.webhooks?.[webhookId] || null);

  /**
   * fetch all the webhooks for a workspace
   * @param workspaceSlug
   */
  fetchWebhooks = async (workspaceSlug: string) =>
    await this.webhookService.fetchWebhooksList(workspaceSlug).then((response) => {
      const webHookObject: { [webhookId: string]: IWebhook } = response.reduce((accumulator, currentWebhook) => {
        if (currentWebhook && currentWebhook.id) {
          return { ...accumulator, [currentWebhook.id]: currentWebhook };
        }
        return accumulator;
      }, {});
      runInAction(() => {
        this.webhooks = webHookObject;
      });
      return response;
    });

  /**
   * fetch webhook info from API using webhook id
   * @param workspaceSlug
   * @param webhookId
   */
  fetchWebhookById = async (workspaceSlug: string, webhookId: string) =>
    await this.webhookService.fetchWebhookDetails(workspaceSlug, webhookId).then((response) => {
      runInAction(() => {
        this.webhooks = {
          ...this.webhooks,
          [response.id]: response,
        };
      });
      return response;
    });

  /**
   * create a new webhook for a workspace using the data
   * @param workspaceSlug
   * @param data
   */
  createWebhook = async (workspaceSlug: string, data: Partial<IWebhook>) =>
    await this.webhookService.createWebhook(workspaceSlug, data).then((response) => {
      const _secretKey = response?.secret_key ?? null;
      delete response?.secret_key;
      const _webhooks = this.webhooks;
      if (response && response.id && _webhooks) _webhooks[response.id] = response;
      runInAction(() => {
        this.webhookSecretKey = _secretKey || null;
        this.webhooks = _webhooks;
      });
      return { webHook: response, secretKey: _secretKey };
    });

  /**
   * update a webhook using the data
   * @param workspaceSlug
   * @param webhookId
   * @param data
   */
  updateWebhook = async (workspaceSlug: string, webhookId: string, data: Partial<IWebhook>) =>
    await this.webhookService.updateWebhook(workspaceSlug, webhookId, data).then((response) => {
      let _webhooks = this.webhooks;
      if (webhookId && _webhooks && this.webhooks)
        _webhooks = { ..._webhooks, [webhookId]: { ...this.webhooks[webhookId], ...data } };
      runInAction(() => {
        this.webhooks = _webhooks;
      });
      return response;
    });

  /**
   * delete a webhook using webhook id
   * @param workspaceSlug
   * @param webhookId
   */
  removeWebhook = async (workspaceSlug: string, webhookId: string) =>
    await this.webhookService.deleteWebhook(workspaceSlug, webhookId).then(() => {
      const _webhooks = this.webhooks ?? {};
      delete _webhooks[webhookId];
      runInAction(() => {
        this.webhooks = _webhooks;
      });
    });

  /**
   * regenerate secret key for a webhook using webhook id
   * @param workspaceSlug
   * @param webhookId
   */
  regenerateSecretKey = async (workspaceSlug: string, webhookId: string) =>
    await this.webhookService.regenerateSecretKey(workspaceSlug, webhookId).then((response) => {
      const _secretKey = response?.secret_key ?? null;
      delete response?.secret_key;
      const _webhooks = this.webhooks;
      if (_webhooks && response && response.id) {
        _webhooks[response.id] = response;
      }
      runInAction(() => {
        this.webhookSecretKey = _secretKey || null;
        this.webhooks = _webhooks;
      });
      return { webHook: response, secretKey: _secretKey };
    });

  /**
   * clear secret key from the store
   */
  clearSecretKey = () => {
    this.webhookSecretKey = null;
  };
}
