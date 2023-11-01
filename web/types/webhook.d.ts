export interface IWebhook {
  id?: string;
  secret_key?: string;
  url: string;
  is_active: boolean;
  project: boolean;
  cycle: boolean;
  module: boolean;
  issue: boolean;
  issue_comment?: boolean;
}

// this interface is used to handle the webhook form state
interface IExtendedWebhook extends IWebhook {
  webhook_events: string;
}
