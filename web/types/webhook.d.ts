export interface IWebhook {
  id?: string;
  secret_key?: string;
  url: string;
  created_at?: string;
  updated_at?: string;
  is_active: boolean;
  project: boolean;
  cycle: boolean;
  module: boolean;
  issue: boolean;
  issue_comment?: boolean;
  workspace?: string;
}

// this interface is used to handle the webhook form state
interface IExtendedWebhook extends IWebhook {
  webhook_events: string;
}
