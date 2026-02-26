/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export interface IWebhook {
  created_at: string;
  cycle: boolean;
  id: string;
  is_active: boolean;
  issue: boolean;
  issue_comment: boolean;
  module: boolean;
  project: boolean;
  secret_key?: string;
  updated_at: string;
  url: string;
}

export type TWebhookEventTypes = "all" | "individual";
