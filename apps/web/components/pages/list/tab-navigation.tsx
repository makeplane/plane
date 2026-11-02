/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import Link from "next/link";
import { Tab, Tabs, TabsList } from "@makeplane/propel/components/tabs";
import { useTranslation } from "@plane/i18n";
// types
import type { TPageNavigationTabs } from "@plane/types";

type TPageTabNavigation = {
  workspaceSlug: string;
  projectId: string;
  pageType: TPageNavigationTabs;
};

// pages tab options
const pageTabs: { key: TPageNavigationTabs; label: string }[] = [
  {
    key: "public",
    label: "Public",
  },
  {
    key: "private",
    label: "Private",
  },
  {
    key: "archived",
    label: "Archived",
  },
];

export function PageTabNavigation(props: TPageTabNavigation) {
  const { workspaceSlug, projectId, pageType } = props;
  const { t } = useTranslation();

  const handleTabClick = (e: React.MouseEvent<HTMLAnchorElement>, tabKey: TPageNavigationTabs) => {
    if (tabKey === pageType) e.preventDefault();
  };

  return (
    <Tabs variant="underline" value={pageType}>
      <div className="-mb-2">
        <TabsList aria-label={t("common.pages")}>
          {pageTabs.map((tab) => (
            <Tab
              key={tab.key}
              value={tab.key}
              label={tab.label}
              nativeButton={false}
              render={
                <Link
                  href={`/${workspaceSlug}/projects/${projectId}/pages?type=${tab.key}`}
                  onClick={(e) => handleTabClick(e, tab.key)}
                />
              }
            />
          ))}
        </TabsList>
      </div>
    </Tabs>
  );
}
