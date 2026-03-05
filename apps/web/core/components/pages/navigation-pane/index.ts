/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane web imports
import { ORDERED_PAGE_NAVIGATION_TABS_LIST } from "@/plane-web/components/pages/navigation-pane";

export * from "./root";
export * from "./types";

export const PAGE_NAVIGATION_PANE_WIDTH = 294;

export const PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM = "paneTab";
export const PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM = "version";

export const PAGE_NAVIGATION_PANE_TAB_KEYS = ORDERED_PAGE_NAVIGATION_TABS_LIST.map((tab) => tab.key);
