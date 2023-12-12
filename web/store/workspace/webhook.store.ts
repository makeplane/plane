// mobx
import { action, observable, makeObservable, computed, runInAction } from "mobx";
import { IWebhook } from "types";
import { WebhookService } from "services/webhook.service";
import { RootStore } from "../root.store";

export interface IWebhookStore {
  // states
  loader: boolean;
  error: any | null;

  // observables
  webhooks: Record<string, IWebhook> | null;
  webhookSecretKey: string | null;

  // computed
  currentWebhook: IWebhook | null;

  // computed actions
  getWebhookById: (webhookId: string) => IWebhook | null;

  // actions
  fetchWebhooks: (workspaceSlug: string) => Promise<IWebhook[]>;
  fetchWebhookById: (workspaceSlug: string, webhookId: string) => Promise<IWebhook>;
  createWebhook: (
    workspaceSlug: string,
    data: Partial<IWebhook>
  ) => Promise<{ webHook: IWebhook; secretKey: string | null }>;
  updateWebhook: (workspaceSlug: string, webhookId: string, data: Partial<IWebhook>) => Promise<IWebhook>;
  removeWebhook: (workspaceSlug: string, webhookId: string) => Promise<void>;
  regenerateSecretKey: (
    workspaceSlug: string,
    webhookId: string
  ) => Promise<{ webHook: IWebhook; secretKey: string | null }>;
  clearSecretKey: () => void;
}

export class WebhookStore implements IWebhookStore {
  // states
  loader: boolean = false;
  error: any | null = null;

  // observables
  webhooks: Record<string, IWebhook> | null = null;
  webhookSecretKey: string | null = null;

  // services
  webhookService;
  // root store
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // states
      loader: observable.ref,
      error: observable.ref,

      // observables
      webhooks: observable,
      webhookSecretKey: observable.ref,

      // computed
      currentWebhook: computed,

      // computed actions
      getWebhookById: action,

      // actions
      fetchWebhooks: action,
      fetchWebhookById: action,
      createWebhook: action,
      updateWebhook: action,
      removeWebhook: action,
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
    const webhookId = this.rootStore.app.router.query?.webhookId;

    if (!webhookId) return null;

    const currentWebhook = this.webhooks?.[webhookId] ?? null;
    return currentWebhook;
  }

  /**
   * get webhook info from the object of webhooks in the store using webhook id
   * @param webhookId
   */
  getWebhookById = (webhookId: string) => this.webhooks?.[webhookId] || null;

  /**
   * fetch all the webhooks for a workspace
   * @param workspaceSlug
   */
  fetchWebhooks = async (workspaceSlug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const webhookResponse = await this.webhookService.fetchWebhooksList(workspaceSlug);

      const webHookObject: { [webhookId: string]: IWebhook } = webhookResponse.reduce((accumulator, currentWebhook) => {
        if (currentWebhook && currentWebhook.id) {
          return { ...accumulator, [currentWebhook.id]: currentWebhook };
        }
        return accumulator;
      }, {});

      runInAction(() => {
        this.webhooks = webHookObject;
        this.loader = false;
        this.error = null;
      });

      return webhookResponse;
    } catch (error) {
      this.loader = false;
      this.error = error;

      throw error;
    }
  };

  /**
   * fetch webhook info from API using webhook id
   * @param workspaceSlug
   * @param webhookId
   */
  fetchWebhookById = async (workspaceSlug: string, webhookId: string) => {
    try {
      const webhookResponse = await this.webhookService.fetchWebhookDetails(workspaceSlug, webhookId);

      runInAction(() => {
        this.webhooks = {
          ...this.webhooks,
          [webhookResponse.id]: webhookResponse,
        };
      });

      return webhookResponse;
    } catch (error) {
      throw error;
    }
  };

  /**
   * create a new webhook for a workspace using the data
   * @param workspaceSlug
   * @param data
   */
  createWebhook = async (workspaceSlug: string, data: Partial<IWebhook>) => {
    try {
      const webhookResponse = await this.webhookService.createWebhook(workspaceSlug, data);

      const _secretKey = webhookResponse?.secret_key ?? null;
      delete webhookResponse?.secret_key;
      const _webhooks = this.webhooks;

      if (webhookResponse && webhookResponse.id && _webhooks) _webhooks[webhookResponse.id] = webhookResponse;

      runInAction(() => {
        this.webhookSecretKey = _secretKey || null;
        this.webhooks = _webhooks;
      });

      return { webHook: webhookResponse, secretKey: _secretKey };
    } catch (error) {
      throw error;
    }
  };

  /**
   * update a webhook using the data
   * @param workspaceSlug
   * @param webhookId
   * @param data
   */
  updateWebhook = async (workspaceSlug: string, webhookId: string, data: Partial<IWebhook>) => {
    try {
      let _webhooks = this.webhooks;

      if (webhookId && _webhooks && this.webhooks)
        _webhooks = { ..._webhooks, [webhookId]: { ...this.webhooks[webhookId], ...data } };

      runInAction(() => {
        this.webhooks = _webhooks;
      });

      const webhookResponse = await this.webhookService.updateWebhook(workspaceSlug, webhookId, data);

      return webhookResponse;
    } catch (error) {
      this.fetchWebhooks(workspaceSlug);
      throw error;
    }
  };

  /**
   * delete a webhook using webhook id
   * @param workspaceSlug
   * @param webhookId
   */
  removeWebhook = async (workspaceSlug: string, webhookId: string) => {
    try {
      await this.webhookService.deleteWebhook(workspaceSlug, webhookId);

      const _webhooks = this.webhooks ?? {};
      delete _webhooks[webhookId];
      runInAction(() => {
        this.webhooks = _webhooks;
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * regenerate secret key for a webhook using webhook id
   * @param workspaceSlug
   * @param webhookId
   */
  regenerateSecretKey = async (workspaceSlug: string, webhookId: string) => {
    try {
      const webhookResponse = await this.webhookService.regenerateSecretKey(workspaceSlug, webhookId);

      const _secretKey = webhookResponse?.secret_key ?? null;
      delete webhookResponse?.secret_key;
      const _webhooks = this.webhooks;

      if (_webhooks && webhookResponse && webhookResponse.id) {
        _webhooks[webhookResponse.id] = webhookResponse;
      }

      runInAction(() => {
        this.webhookSecretKey = _secretKey || null;
        this.webhooks = _webhooks;
      });
      return { webHook: webhookResponse, secretKey: _secretKey };
    } catch (error) {
      throw error;
    }
  };

  /**
   * clear secret key from the store
   */
  clearSecretKey = () => {
    this.webhookSecretKey = null;
  };
}
