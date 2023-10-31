// mobx
import { action, observable, makeObservable, runInAction } from "mobx";
import { IWebhook } from "types";
import { WebhookService } from "services/webhook.service";

export interface IWebhookStore {
  loader: boolean;
  error: any | null;

  webhooks: IWebhook[] | [];
  webhookSecretKey: string | null;

  // actions
  fetchAll: (workspaceSlug: string) => Promise<IWebhook[]>;
  fetchById: (workspaceSlug: string, webhook_id: string) => Promise<IWebhook>;
  create: (workspaceSlug: string, data: IWebhook) => Promise<IWebhook>;
  update: (workspaceSlug: string, webhook_id: string, data: IWebhook) => Promise<IWebhook>;
  remove: (workspaceSlug: string, webhook_id: string) => Promise<void>;
  regenerate: (workspaceSlug: string, webhook_id: string, data: IWebhook) => Promise<void>;
}

export class WebhookStore implements IWebhookStore {
  loader: boolean = false;
  error: any | null = null;

  webhooks: IWebhook[] | [] = [];
  webhookSecretKey: string | null = null;

  // root store
  rootStore;
  webhookService;

  constructor(_rootStore: any | null = null) {
    makeObservable(this, {
      loader: observable.ref,
      error: observable.ref,

      webhooks: observable.ref,
      webhookSecretKey: observable.ref,

      fetchAll: action,
      create: action,
      fetchById: action,
      update: action,
      remove: action,
      regenerate: action,
    });
    this.rootStore = _rootStore;
    this.webhookService = new WebhookService();
  }

  fetchAll = async (workspaceSlug: string) => {
    try {
      this.loader = true;
      this.error = null;
      const webhookResponse = await this.webhookService.getAll(workspaceSlug);
      runInAction(() => {
        this.webhooks = webhookResponse;
        this.loader = true;
        this.error = null;
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
      const _webhooks = [...this.webhooks, webhookResponse];
      runInAction(() => {
        this.webhookSecretKey = _secretKey || null;
        this.webhooks = _webhooks;
      });
      return webhookResponse;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  fetchById = async (workspaceSlug: string, webhook_id: string) => {
    try {
      const webhookResponse = await this.webhookService.getById(workspaceSlug, webhook_id);
      return webhookResponse;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  update = async (workspaceSlug: string, webhook_id: string, data: IWebhook) => {
    try {
      const webhookResponse = await this.webhookService.update(workspaceSlug, webhook_id, data);
      const _updatedWebhooks = this.webhooks.map((element) => {
        if (element.id === webhook_id) {
          return webhookResponse;
        } else {
          return element;
        }
      });
      runInAction(() => {
        this.webhooks = _updatedWebhooks;
      });
      return webhookResponse;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  remove = async (workspaceSlug: string, webhook_id: string) => {
    try {
      const webhookResponse = await this.webhookService.remove(workspaceSlug, webhook_id);
      const _webhooks = this.webhooks.filter((element) => element.id != webhook_id);
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
      const webhookResponse = await this.webhookService.remove(workspaceSlug, webhook_id);
      return webhookResponse;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
}
