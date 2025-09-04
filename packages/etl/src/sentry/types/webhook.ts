import { SentryActor, SentryAlertFields, SentryIssue } from "./service";

// Header Types
export interface SentryWebhookHeaders {
  "content-type": "application/json";
  "request-id": string;
  "sentry-hook-resource": SentryHookResource;
  "sentry-hook-timestamp": string;
  "sentry-hook-signature": string;
}

// Resource Types
export type SentryHookResource = "installation" | "event_alert" | "issue" | "metric_alert" | "error" | "comment";

// Installation Types
export interface SentryInstallation {
  uuid: string;
}

// Base Webhook Structure
export interface SentryWebhookBase {
  action: string;
  actor: SentryActor;
  installation: SentryInstallation;
  data: unknown; // This will be overridden by specific event types
}

export interface SentryCommentData {
  id: string;
  text: string;
  // Add other comment-specific fields
}

export interface SentryErrorData {
  id: string;
  message: string;
  // Add other error-specific fields
}

export interface SentryMetricAlertData {
  id: string;
  metric: string;
  // Add other metric alert-specific fields
}

export interface SentryEventAlertData {
  event: {
    issue_id: string;
    title: string;
    message: string;
    web_url: string;
    issue_url: string;
    // Including status if needed, though it wasn't in the example payload
    status?: string;
  }; // Add other event alert-specific fields
  issue_alert: {
    title: string;
    settings: SentryAlertFields[];
  };
}
// Installation Data Types
export interface SentryInstallationData {
  uuid: string;
  status: "installed" | "pending_deletion" | "deleted";
  app: {
    uuid: string;
    slug: string;
  };
  organization: {
    slug: string;
    name: string;
    uuid: string;
  };
}

// Installation Webhook Type
export interface SentryInstallationWebhook extends SentryWebhookBase {
  action: "created" | "deleted" | "updated";
  data: SentryInstallationData;
}

// Specific Webhook Types
export interface SentryIssueWebhook extends SentryWebhookBase {
  data: {
    resolution_type: string;
    issue: SentryIssue;
  };
}

export interface SentryCommentWebhook extends SentryWebhookBase {
  data: SentryCommentData;
}

export interface SentryErrorWebhook extends SentryWebhookBase {
  data: SentryErrorData;
}

export interface SentryMetricAlertWebhook extends SentryWebhookBase {
  data: SentryMetricAlertData;
}

export interface SentryEventAlertWebhook extends SentryWebhookBase {
  action: string;
  data: SentryEventAlertData;
  installation: {
    uuid: string;
  };
}

// Union type for all possible webhook payloads
export type SentryWebhookPayload =
  | SentryIssueWebhook
  | SentryCommentWebhook
  | SentryErrorWebhook
  | SentryMetricAlertWebhook
  | SentryEventAlertWebhook
  | SentryInstallationWebhook;
