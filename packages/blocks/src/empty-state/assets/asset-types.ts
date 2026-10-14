/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Horizontal Stack Asset Types
export type HorizontalStackAssetType =
  | "customer"
  | "custom-properties"
  | "epic"
  | "estimate"
  | "export"
  | "group-syncing"
  | "intake"
  | "label"
  | "link"
  | "members"
  | "note"
  | "page"
  | "priority"
  | "project"
  | "search-compact"
  | "settings"
  | "script"
  | "state"
  | "state-square"
  | "template"
  | "token"
  | "unknown"
  | "update"
  | "webhook"
  | "work-item"
  | "worklog"
  | "runner-functions"
  | "runner-scripts"
  | "workflow"
  | "ai-skills"
  | "ai-agents"
  | "memory";

// Vertical Stack Asset Types
export type VerticalStackAssetType =
  | "archived-cycle"
  | "archived-module"
  | "archived-work-item"
  | "changelog"
  | "customer"
  | "cycle"
  | "dashboard"
  | "draft"
  | "epic"
  | "error-404"
  | "inbox"
  | "initiative"
  | "invalid-link"
  | "milestone"
  | "module"
  | "no-access"
  | "page"
  | "property"
  | "project"
  | "server-error"
  | "stickies"
  | "teamspace"
  | "view"
  | "work-item"
  | "workflow";

// Illustration Asset Types
export type IllustrationAssetType = "inbox" | "search";

// Combined Asset Types for Compact (uses horizontal + illustration)
export type CompactAssetType = HorizontalStackAssetType | IllustrationAssetType;

// Combined Asset Types for Detailed (uses vertical + illustration)
export type DetailedAssetType = VerticalStackAssetType | IllustrationAssetType;
