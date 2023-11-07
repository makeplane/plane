// mobx
import { action, observable, makeObservable, computed, runInAction } from "mobx";
import { IWebhook } from "types";
import { WebhookService } from "services/webhook.service";

export interface IWebhookStore {
  loader: boolean;
  error: any | null;

  webhooks: IWebhook[] | [];
  webhook_id: string | null;
  webhook_detail: {
    [webhook_id: string]: IWebhook;
  } | null;
  webhookSecretKey: string | null;

  // computed
  currentWebhook: IWebhook | null;

  // actions
  fetchAll: (workspaceSlug: string) => Promise<IWebhook[]>;
  fetchById: (workspaceSlug: string, webhook_id: string) => Promise<IWebhook>;
  create: (workspaceSlug: string, data: IWebhook) => Promise<IWebhook>;
  update: (workspaceSlug: string, webhook_id: string, data: IWebhook) => Promise<IWebhook>;
  remove: (workspaceSlug: string, webhook_id: string) => Promise<void>;
  regenerate: (workspaceSlug: string, webhook_id: string) => Promise<IWebhook>;
  clearSecretKey: () => void;
}

export class WebhookStore implements IWebhookStore {
  loader: boolean = false;
  error: any | null = null;

  webhooks: IWebhook[] | [] = [];
  webhook_id: string | null = null;
  webhook_detail: {
    [webhook_id: string]: IWebhook;
  } | null = null;
  webhookSecretKey: string | null = null;

  // root store
  rootStore;
  webhookService;

  constructor(_rootStore: any | null = null) {
    makeObservable(this, {
      loader: observable.ref,
      error: observable.ref,

      webhooks: observable.ref,
      webhook_id: observable.ref,
      webhook_detail: observable.ref,
      webhookSecretKey: observable.ref,

      currentWebhook: computed,

      fetchAll: action,
      create: action,
      fetchById: action,
      update: action,
      remove: action,
      regenerate: action,
      clearSecretKey: action
    });
    this.rootStore = _rootStore;
    this.webhookService = new WebhookService();
  }

  get currentWebhook() {
    if (!this.webhook_id) return null;
    const currentWebhook = this.webhook_detail ? this.webhook_detail[this.webhook_id] : null;
    return currentWebhook;
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
        this.webhook_detail = {...this.webhook_detail, [webhookResponse.id!]: webhookResponse};
        this.webhook_id = webhookResponse.id!;
        console.log(this.webhook_detail);
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

      const _webhook_detail = {
        ...this.webhook_detail,
        [webhook_id]: webhookResponse,
      };
      runInAction(() => {
        this.webhook_id = webhook_id;
        this.webhook_detail = _webhook_detail;
      });

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
      const _webhookDetail = { ...this.webhook_detail, [webhook_id]: webhookResponse };
      runInAction(() => {
        this.webhooks = _updatedWebhooks;
        this.webhook_detail = _webhookDetail;
      });

      return webhookResponse;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  remove = async (workspaceSlug: string, webhook_id: string) => {
    try {
      await this.webhookService.remove(workspaceSlug, webhook_id);

      const _webhooks = this.webhooks.filter((element) => element.id != webhook_id);
      const _webhookDetail = { ...this.webhook_detail };
      delete _webhookDetail[webhook_id];
      runInAction(() => {
        this.webhooks = _webhooks;
        this.webhook_detail = _webhookDetail;
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  regenerate = async (workspaceSlug: string, webhook_id: string) => {
    try {
      const webhookResponse = await this.webhookService.regenerate(workspaceSlug, webhook_id);
      runInAction(() => {
        this.webhookSecretKey = webhookResponse.secret_key!;
        this.webhook_detail = {...this.webhook_detail, [webhook_id]: webhookResponse};
      });
      return webhookResponse;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  clearSecretKey = () => {
    this.webhookSecretKey = null;
  }
}
