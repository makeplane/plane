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

// plane web imports
import { ORDERED_PAGE_NAVIGATION_TABS_LIST } from "@/plane-web/components/pages/navigation-pane";

export * from "./root";
export * from "./types";

// Re-export constants with backward compatibility
export const PAGE_NAVIGATION_PANE_WIDTH = 294;
export const PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM = "paneTab";
export const PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM = "version";
export const PAGE_NAVIGATION_PANE_HIGHLIGHT_CHANGES_QUERY_PARAM = "highlightChanges";

export const PAGE_NAVIGATION_PANE_TAB_KEYS = ORDERED_PAGE_NAVIGATION_TABS_LIST.map((tab) => tab.key);
