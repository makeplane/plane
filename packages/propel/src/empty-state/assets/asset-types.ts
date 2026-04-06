/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
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
  | "workflow";

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
  | "initiative"
  | "invalid-link"
  | "module"
  | "no-access"
  | "page"
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
