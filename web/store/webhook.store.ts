// mobx
import { action, observable, makeObservable, computed, runInAction } from "mobx";
import { IWebhook } from "types";
import { WebhookService } from "services/webhook.service";

export interface IWebhookStore {
  loader: boolean;
  error: any | undefined;

  webhooks: { [webhookId: string]: IWebhook } | null;
  currentWebhookId: string | undefined;
  webhookSecretKey: string | undefined;

  // computed
  currentWebhook: IWebhook | undefined;

  // actions
  setCurrentWebhookId: (webhookId: string | undefined) => void;
  fetchWebhooks: (workspaceSlug: string) => Promise<IWebhook[]>;
  fetchWebhookById: (workspaceSlug: string, webhook_id: string) => Promise<IWebhook>;
  createWebhook: (
    workspaceSlug: string,
    data: Partial<IWebhook>
  ) => Promise<{ webHook: IWebhook; secretKey: string | undefined }>;
  updateWebhook: (workspaceSlug: string, webhook_id: string, data: Partial<IWebhook>) => Promise<IWebhook>;
  removeWebhook: (workspaceSlug: string, webhook_id: string) => Promise<void>;
  regenerateSecretKey: (
    workspaceSlug: string,
    webhook_id: string
  ) => Promise<{ webHook: IWebhook; secretKey: string | undefined }>;
  clearSecretKey: () => void;
}

export class WebhookStore implements IWebhookStore {
  loader: boolean = false;
  error: any | undefined = undefined;

  webhooks: { [webhookId: string]: IWebhook } | null = null;
  currentWebhookId: string | undefined = undefined;
  webhookSecretKey: string | undefined = undefined;

  // root store
  rootStore;
  webhookService;

  constructor(_rootStore: any | undefined = undefined) {
    makeObservable(this, {
      loader: observable.ref,
      error: observable.ref,

      webhooks: observable.ref,
      currentWebhookId: observable.ref,
      webhookSecretKey: observable.ref,

      currentWebhook: computed,

      fetchWebhooks: action,
      createWebhook: action,
      fetchWebhookById: action,
      updateWebhook: action,
      removeWebhook: action,
      regenerateSecretKey: action,
      clearSecretKey: action,
    });

    this.rootStore = _rootStore;
    this.webhookService = new WebhookService();
  }

  get currentWebhook() {
    if (!this.currentWebhookId) return undefined;

    const currentWebhook = this.webhooks?.[this.currentWebhookId] ?? undefined;
    return currentWebhook;
  }

  setCurrentWebhookId = (webhookId: string | undefined) => {
    this.currentWebhookId = webhookId;
  };

  fetchWebhooks = async (workspaceSlug: string) => {
    try {
      this.loader = true;
      this.error = undefined;

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
        this.error = undefined;
      });

      return webhookResponse;
    } catch (error) {
      this.loader = false;
      this.error = error;

      throw error;
    }
  };

  createWebhook = async (workspaceSlug: string, data: Partial<IWebhook>) => {
    try {
      const webhookResponse = await this.webhookService.createWebhook(workspaceSlug, data);

      const _secretKey = webhookResponse?.secret_key;
      delete webhookResponse?.secret_key;
      const _webhooks = this.webhooks;

      if (webhookResponse && webhookResponse.id && _webhooks) _webhooks[webhookResponse.id] = webhookResponse;

      runInAction(() => {
        this.webhookSecretKey = _secretKey || undefined;
        this.webhooks = _webhooks;
      });

      return { webHook: webhookResponse, secretKey: _secretKey };
    } catch (error) {
      throw error;
    }
  };

  fetchWebhookById = async (workspaceSlug: string, webhook_id: string) => {
    try {
      const webhookResponse = await this.webhookService.fetchWebhookDetails(workspaceSlug, webhook_id);

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

  updateWebhook = async (workspaceSlug: string, webhook_id: string, data: Partial<IWebhook>) => {
    try {
      let _webhooks = this.webhooks;

      if (webhook_id && _webhooks && this.webhooks)
        _webhooks = { ..._webhooks, [webhook_id]: { ...this.webhooks[webhook_id], ...data } };

      runInAction(() => {
        this.webhooks = _webhooks;
      });

      const webhookResponse = await this.webhookService.updateWebhook(workspaceSlug, webhook_id, data);

      return webhookResponse;
    } catch (error) {
      this.fetchWebhooks(workspaceSlug);
      throw error;
    }
  };

  removeWebhook = async (workspaceSlug: string, webhook_id: string) => {
    try {
      await this.webhookService.deleteWebhook(workspaceSlug, webhook_id);

      const _webhooks = this.webhooks ?? {};
      delete _webhooks[webhook_id];
      runInAction(() => {
        this.webhooks = _webhooks;
      });
    } catch (error) {
      throw error;
    }
  };

  regenerateSecretKey = async (workspaceSlug: string, webhook_id: string) => {
    try {
      const webhookResponse = await this.webhookService.regenerateSecretKey(workspaceSlug, webhook_id);

      const _secretKey = webhookResponse?.secret_key;
      delete webhookResponse?.secret_key;
      const _webhooks = this.webhooks;

      if (_webhooks && webhookResponse && webhookResponse.id) {
        _webhooks[webhookResponse.id] = webhookResponse;
      }

      runInAction(() => {
        this.webhookSecretKey = _secretKey || undefined;
        this.webhooks = _webhooks;
      });
      return { webHook: webhookResponse, secretKey: _secretKey };
    } catch (error) {
      throw error;
    }
  };

  clearSecretKey = () => {
    this.webhookSecretKey = undefined;
  };
}
