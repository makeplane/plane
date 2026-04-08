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

import React from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
// local imports
import { CollectionsSection } from "./section/collections-section";
import { WikiSidebarListSectionRoot } from "./section/section-root";

type Props = {
  expandedPageIds?: string[];
  setExpandedPageIds?: React.Dispatch<React.SetStateAction<string[]>>;
};

export const PagesAppSidebarList = observer(function PagesAppSidebarList(props: Props) {
  const { expandedPageIds = [], setExpandedPageIds } = props;
  // params
  const { pageId } = useParams();
  const pathname = usePathname();
  const isCollectionRoute = pathname?.includes("/wiki/collections/");
  // Current page ID only on actual wiki page detail routes
  const currentPageId = !isCollectionRoute && pageId ? pageId.toString() : undefined;

  return (
    <div className="vertical-scrollbar -mr-3 -ml-4 flex h-full flex-col gap-2 !overflow-y-scroll scrollbar-sm pl-4 pb-2">
      <CollectionsSection />
      <WikiSidebarListSectionRoot
        currentPageId={currentPageId}
        expandedPageIds={expandedPageIds}
        sectionType="shared"
        setExpandedPageIds={setExpandedPageIds}
      />
      <WikiSidebarListSectionRoot
        currentPageId={currentPageId}
        expandedPageIds={expandedPageIds}
        sectionType="private"
        setExpandedPageIds={setExpandedPageIds}
      />
      <WikiSidebarListSectionRoot
        currentPageId={currentPageId}
        expandedPageIds={expandedPageIds}
        sectionType="archived"
        setExpandedPageIds={setExpandedPageIds}
      />
    </div>
  );
});
