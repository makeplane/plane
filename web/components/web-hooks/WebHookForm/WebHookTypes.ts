export interface IWebhookIndividualOptions {
  key: string;
  label: string;
  name: "project" | "cycle" | "module" | "issue" | "issue_comment";
}

export interface IWebhookOptions {
  key: string;
  label: string;
  name: "webhook_events";
}

export enum WebHookFormTypes {
  EDIT = "edit",
  CREATE = "create",
}
