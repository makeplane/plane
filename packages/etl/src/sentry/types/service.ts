import { ExState } from "@plane/sdk";

// Actor Types
export interface SentryActor {
  type: "user" | "application";
  id: string | number;
  name: string;
}

export interface TSentryStateMapping {
  projectId: string;
  resolvedState: ExState;
  unresolvedState: ExState;
}

export interface TSentryConfig {
  alertRuleConfig?: SentryAlertFields;
  stateMappings?: TSentryStateMapping[];
}

export type TSentryConnectionData = any;
export type SentryLinkFields = { identifier?: string };

export type SentryCreateFields = {
  title: string;
  description: string;
  project_id: string;
  assignee_ids: string[] | ""; // Can be empty string or array of strings
  priorities: string | "";
  labels: string[] | ""; // Can be empty string or array of strings
  state: string | "";
  module: string | "";
  cycle: string | "";
};

// Main type
export type SentryData = {
  fields: SentryLinkFields | SentryCreateFields;
  issueId: number;
  installationId: string;
  webUrl: string;
  project: { id: string; slug: string };
  actor: SentryActor;
};

export type SentryIssueStatus = "unresolved" | "resolvedInNextRelease" | "resolved" | "ignored";

export type SentryProject = {
  id: string;
  name: string;
  slug: string;
};

export type Metadata = {
  title: string;
};

export type SentryIssue = {
  annotations: any[];
  assignedTo: null | string;
  count: string;
  culprit: string;
  firstSeen: string; // ISO date string
  hasSeen: boolean;
  id: string;
  isBookmarked: boolean;
  isPublic: boolean;
  isSubscribed: boolean;
  lastSeen: string; // ISO date string
  level: "error" | string;
  logger: null | string;
  metadata: Metadata;
  numComments: number;
  permalink: string;
  project: SentryProject;
  shareId: null | string;
  shortId: string;
  status: SentryIssueStatus;
  statusDetails: Record<string, any>;
  subscriptionDetails: null | any;
  title: string;
  type: "default" | string;
  userCount: number;
};

export type SentryExternalLink = {
  id: string;
  issueId: string;
  serviceType: string;
  displayName: string;
  webUrl: string;
};

export type SentryAlertFields = {
  name: "type" | "project_id" | "assignee_ids" | "state" | "labels";
  value: string | string[];
};

export type SentryAlertRulePayload = {
  installationId: string;
  fields: SentryAlertFields[];
};
