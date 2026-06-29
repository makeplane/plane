/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TMailFolderKey = "inbox" | "starred" | "sent" | "drafts" | "archive" | "spam" | "trash";

export type TMailAddress = {
  name: string;
  email: string;
};

export type TMailMailbox = {
  id: string;
  email: string;
  local_part: string;
  domain: string;
  quota_mb: number;
  owner_id: string | null;
};

export type TMailMeConfig = {
  has_mailbox: boolean;
  mail_domain: string;
  webmail_url?: string | null;
  mailbox?: TMailMailbox;
};

export type TMailAccountCreatePayload = {
  local_part?: string;
  email?: string;
  domain?: string;
  password: string;
};

export type TMailAccountLoginPayload = {
  email: string;
  password: string;
};

export type TMailFolder = {
  key: TMailFolderKey | string;
  name: string;
  label: string;
  delimiter: string;
  special_use: string;
  virtual: boolean;
  total: number;
  unread: number;
};

export type TMailAttachment = {
  part_id: string;
  filename: string;
  content_type: string;
  size: number;
  disposition?: string;
};

export type TMailUploadedAttachment = {
  key: string;
  filename: string;
  content_type: string;
  size: number;
};

export type TMailSendStatus = "queued" | "sending" | "sent" | "failed";

export type TMailMessageSummary = {
  uid: string;
  folder_key: string;
  subject: string;
  from: TMailAddress[];
  to: TMailAddress[];
  date: string;
  snippet: string;
  is_read: boolean;
  is_starred: boolean;
  has_attachments: boolean;
  size: number;
  send_status?: TMailSendStatus | null;
  send_error?: string;
};

export type TMailMessageDetail = TMailMessageSummary & {
  cc: TMailAddress[];
  bcc: TMailAddress[];
  reply_to: TMailAddress[];
  message_id: string;
  headers: Record<string, string>;
  text: string;
  html: string;
  attachments: TMailAttachment[];
};

export type TMailMessagesResponse = {
  results: TMailMessageSummary[];
  page: number;
  per_page: number;
  total: number;
};

export type TMailComposePayload = {
  from_name?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  reply_to?: string[];
  subject: string;
  body_html?: string;
  body_text?: string;
  uploaded_attachments?: TMailUploadedAttachment[];
};

export type TMailSendResponse = {
  queued: boolean;
  outbound?: TMailMessageSummary;
};

export type TMailSignature = {
  id: string;
  name: string;
  content_html: string;
  content_text: string;
  is_default: boolean;
  is_active: boolean;
};

export type TMailTemplate = {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  category: string;
};

export type TMailFilterRule = {
  id: string;
  name: string;
  is_active: boolean;
  order: number;
  match_type: "all" | "any";
  conditions: Record<string, unknown>[];
  actions: Record<string, unknown>[];
};

export type TMailLabel = {
  id: string;
  name: string;
  color: string;
};

export type TMailSavedSearch = {
  id: string;
  name: string;
  query: string;
  filters: Record<string, unknown>;
};

export type TMailForwarding = {
  id: string;
  forward_enabled: boolean;
  forward_to: string[];
  keep_copy: boolean;
  vacation_enabled: boolean;
  vacation_subject: string;
  vacation_message: string;
  vacation_start: string | null;
  vacation_end: string | null;
};

export type TMailPreference = {
  id: string;
  density: "comfortable" | "compact" | string;
  theme: "system" | "light" | "dark" | string;
  reading_pane: "right" | "bottom" | "none" | string;
  messages_per_page: number;
  mark_read_delay_ms: number;
  show_snippets: boolean;
  default_signature: string | null;
  language: string;
  conversation_view: boolean;
};
