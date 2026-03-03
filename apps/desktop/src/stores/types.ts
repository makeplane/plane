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

// Persisted tab data (stored in electron-store)
export interface PersistedTab {
  id: string;
  path: string; // e.g., "/workspace/project" or "/"
}

// Persisted window data (stored in electron-store)
export interface PersistedWindow {
  id: string;
  tabs: PersistedTab[];
  activeTabId: string | undefined;
}

// Runtime tab data (includes derived state like title)
export interface Tab extends PersistedTab {
  title: string;
}

export interface TabWithFavicon extends Tab {
  favicon?: string;
}

export interface StoreSchema {
  instanceUrl: string | undefined;
  windows: PersistedWindow[];
  schemaVersion: number;
}

/**
 * Window layout mode
 * - 'setup': Full-screen setup view, no tab bar (for instance configuration)
 * - 'app': Normal app view with tab bar visible (for connected instance)
 */
export type WindowLayoutMode = "setup" | "app";
