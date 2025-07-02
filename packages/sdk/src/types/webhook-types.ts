import { ExIssue, ExIssueComment, PlaneUser } from "./types";

// Common types
type UUID = string;

export interface PlaneActivity {
  timestamp: string;
  field: string;
  new_value: string | null;
  old_value: string | null;
  actor: PlaneUser;
  old_identifier: string | null;
  new_identifier: string | null;
}

// Main webhook payload interfaces
export interface WebhookPayloadBase {
  event: string;
  action: string;
  webhook_id: UUID;
  workspace_id: UUID;
  activity: PlaneActivity;
}

export interface WebhookIssuePayload extends WebhookPayloadBase {
  created: {
    event: "issue";
    action: "created";
    data: ExIssue;
  };
  updated: {
    event: "issue";
    action: "updated";
    data: ExIssue;
  };
  deleted: {
    event: "issue";
    action: "deleted";
    data: {
      id: string;
    };
  };
}

export interface WebhookIssueCommentPayload extends WebhookPayloadBase {
  created: {
    event: "issue_comment";
    action: "created";
    data: ExIssueComment;
  };
  updated: {
    event: "issue_comment";
    action: "updated";
    data: ExIssueComment;
  };
  deleted: {
    event: "issue_comment";
    action: "deleted";
    data: {
      id: string;
    };
  };
}

export enum E_PLANE_WEBHOOK_EVENT {
  ISSUE = "issue",
  ISSUE_COMMENT = "issue_comment",
}

export enum E_PLANE_WEBHOOK_ACTION {
  CREATED = "created",
  UPDATED = "updated",
  DELETED = "deleted",
}

// Union type for all possible webhook payloads
export type PlaneWebhookData = WebhookIssuePayload | WebhookIssueCommentPayload;

// Main webhook payload interfaces
export interface PlaneWebhookPayloadBase<data = any> {
  event: string;
  data: any;
  action: string;
  webhook_id: UUID;
  workspace_id: UUID;
  activity: PlaneActivity;
}

// Union type for all possible webhook payloads
export type PlaneWebhookPayload = {
  id: string;
  event: string;
  workspace: string;
  project: string;
  issue: string;
  isEnterprise: boolean;
};

export type PlaneIssueWebhookPayload = PlaneWebhookPayload;
export type PlaneIssueCommentWebhookPayload = PlaneWebhookPayload & {
  issue: string;
};
