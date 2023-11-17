// mobx
import { action, observable, makeObservable, computed, runInAction } from "mobx";
import { IWebhook } from "types";
import { WebhookService } from "services/webhook.service";

export interface IWebhookStore {
  loader: boolean;
  error: any | undefined;

  webhooks: { [webhookId: string]: IWebhook };
  currentWebhookId: string | undefined;
  webhookSecretKey: string | undefined;

  // computed
  currentWebhook: IWebhook | undefined;

  // actions
  fetchWebhooks: (workspaceSlug: string) => Promise<IWebhook[]>;
  fetchById: (workspaceSlug: string, webhook_id: string) => Promise<IWebhook>;
  create: (workspaceSlug: string, data: IWebhook) => Promise<{ webHook: IWebhook; secretKey: string | undefined }>;
  update: (workspaceSlug: string, webhook_id: string, data: Partial<IWebhook>) => Promise<IWebhook>;
  remove: (workspaceSlug: string, webhook_id: string) => Promise<void>;
  regenerate: (
    workspaceSlug: string,
    webhook_id: string
  ) => Promise<{ webHook: IWebhook; secretKey: string | undefined }>;
  clearSecretKey: () => void;
}

export class WebhookStore implements IWebhookStore {
  loader: boolean = false;
  error: any | undefined = undefined;

  webhooks: { [webhookId: string]: IWebhook } = {};
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
      create: action,
      fetchById: action,
      update: action,
      remove: action,
      regenerate: action,
      clearSecretKey: action,
    });
    this.rootStore = _rootStore;
    this.webhookService = new WebhookService();
  }

  get currentWebhook() {
    if (!this.currentWebhookId) return undefined;
    const currentWebhook = this.webhooks ? this.webhooks[this.currentWebhookId] : undefined;
    return currentWebhook;
  }

  fetchWebhooks = async (workspaceSlug: string) => {
    try {
      this.loader = true;
      this.error = undefined;
      const webhookResponse = await this.webhookService.getAll(workspaceSlug);

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

  create = async (workspaceSlug: string, data: IWebhook) => {
    try {
      const webhookResponse = await this.webhookService.create(workspaceSlug, data);

      const _secretKey = webhookResponse?.secret_key;
      delete webhookResponse?.secret_key;
      const _webhooks = this.webhooks;

      if (webhookResponse && webhookResponse.id) {
        _webhooks[webhookResponse.id] = webhookResponse;
      }

      runInAction(() => {
        this.webhookSecretKey = _secretKey || undefined;
        this.webhooks = _webhooks;
        this.currentWebhookId = webhookResponse.id;
      });

      return { webHook: webhookResponse, secretKey: _secretKey };
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  fetchById = async (workspaceSlug: string, webhook_id: string) => {
    try {
      const webhookResponse = await this.webhookService.getById(workspaceSlug, webhook_id);

      const _webhooks = this.webhooks;

      if (webhookResponse && webhookResponse.id) {
        _webhooks[webhookResponse.id] = webhookResponse;
      }
      runInAction(() => {
        this.currentWebhookId = webhook_id;
        this.webhooks = _webhooks;
      });

      return webhookResponse;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  update = async (workspaceSlug: string, webhook_id: string, data: Partial<IWebhook>) => {
    try {
      let _webhooks = this.webhooks;

      if (webhook_id) {
        _webhooks = { ..._webhooks, [webhook_id]: { ...this.webhooks[webhook_id], ...data } };
      }

      runInAction(() => {
        this.webhooks = _webhooks;
      });

      const webhookResponse = await this.webhookService.update(workspaceSlug, webhook_id, data);

      return webhookResponse;
    } catch (error) {
      console.log(error);
      this.fetchWebhooks(workspaceSlug);
      throw error;
    }
  };

  remove = async (workspaceSlug: string, webhook_id: string) => {
    try {
      await this.webhookService.remove(workspaceSlug, webhook_id);

      const _webhooks = this.webhooks;
      delete _webhooks[webhook_id];
      runInAction(() => {
        this.webhooks = _webhooks;
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  regenerate = async (workspaceSlug: string, webhook_id: string) => {
    try {
      const webhookResponse = await this.webhookService.regenerate(workspaceSlug, webhook_id);

      const _secretKey = webhookResponse?.secret_key;
      delete webhookResponse?.secret_key;
      const _webhooks = this.webhooks;

      if (webhookResponse && webhookResponse.id) {
        _webhooks[webhookResponse.id] = webhookResponse;
      }

      runInAction(() => {
        this.webhookSecretKey = _secretKey || undefined;
        this.webhooks = _webhooks;
      });
      return { webHook: webhookResponse, secretKey: _secretKey };
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  clearSecretKey = () => {
    this.webhookSecretKey = undefined;
  };
}
