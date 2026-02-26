/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import type { TPageNavigationPaneTab } from "..";

export type TPageNavigationPaneAdditionalTabPanelsRootProps = {
  activeTab: TPageNavigationPaneTab;
  page: TPageInstance;
};

export function PageNavigationPaneAdditionalTabPanelsRoot(_props: TPageNavigationPaneAdditionalTabPanelsRootProps) {
  return null;
}
