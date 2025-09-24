import { SentryApiService, SentryWebhookPayload } from "@plane/etl/sentry";
import { Client } from "@plane/sdk";
import { Store } from "@/worker/base";

export interface TSentryServices {
  planeClient: Client;
  sentryService: SentryApiService;
}

export interface ISentryTaskHandler {
  handle(store: Store, data: SentryWebhookPayload): Promise<void>;
}

export enum ESentryWebhookType {
  ISSUE = "issue",
  EVENT_ALERT = "event_alert",
  INSTALLATION = "installation",
}

export enum ESentryEntityConnectionType {
  SENTRY_ISSUE = "SENTRY_ISSUE",
}

export enum EPlaneStates {
  BACKLOG = "backlog",
  COMPLETED = "completed",
}
