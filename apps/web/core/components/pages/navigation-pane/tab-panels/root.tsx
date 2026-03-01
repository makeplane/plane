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

// plane imports
import { Tabs } from "@plane/propel/tabs";
// components
import type { TPageRootHandlers } from "@/components/pages/editor/page-root";
// plane web imports
import { ORDERED_PAGE_NAVIGATION_TABS_LIST } from "@/plane-web/components/pages/navigation-pane";
import { PageNavigationPaneAdditionalTabPanelsRoot } from "@/plane-web/components/pages/navigation-pane/tab-panels/root";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageNavigationPaneAssetsTabPanel } from "./assets";
import { PageNavigationPaneInfoTabPanel } from "./info/root";
import { PageNavigationPaneOutlineTabPanel } from "./outline";

type Props = {
  page: TPageInstance;
  versionHistory: Pick<TPageRootHandlers, "fetchAllVersions" | "fetchVersionDetails">;
};

export function PageNavigationPaneTabPanelsRoot(props: Props) {
  const { page, versionHistory } = props;

  return (
    <>
      {ORDERED_PAGE_NAVIGATION_TABS_LIST.map((tab) => (
        <Tabs.Content key={tab.key} value={tab.key} className="py-2 flex-1 overflow-hidden">
          {tab.key === "outline" && <PageNavigationPaneOutlineTabPanel page={page} />}
          {tab.key === "info" && <PageNavigationPaneInfoTabPanel page={page} versionHistory={versionHistory} />}
          {tab.key === "assets" && <PageNavigationPaneAssetsTabPanel page={page} />}
          <PageNavigationPaneAdditionalTabPanelsRoot activeTab={tab.key} page={page} />
        </Tabs.Content>
      ))}
    </>
  );
}
