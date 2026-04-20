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

import { observer } from "mobx-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// plane imports
import { TabNavigationList, TabNavigationItem } from "@plane/propel/tab-navigation";
// hooks
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
// types
import { EWorkspaceFeatures } from "@/types/workspace-feature";

const ARCHIVES_TAB_LIST: {
  key: string;
  label: string;
  shouldRender: (isEnabled: { initiatives: boolean }) => boolean;
}[] = [
  {
    key: "projects",
    label: "Projects",
    shouldRender: () => true,
  },
  {
    key: "initiatives",
    label: "Initiatives",
    shouldRender: ({ initiatives }) => initiatives,
  },
];

export const WorkspaceArchivesTabList = observer(function WorkspaceArchivesTabList(props: { workspaceSlug: string }) {
  // router
  const { workspaceSlug } = props;
  const pathname = usePathname();
  // hooks
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  // derived values
  const isInitiativesFeatureEnabled = isWorkspaceFeatureEnabled(
    workspaceSlug,
    EWorkspaceFeatures.IS_INITIATIVES_ENABLED
  );

  const isEnabled = { initiatives: isInitiativesFeatureEnabled };

  return (
    <>
      <TabNavigationList className="h-full">
        {ARCHIVES_TAB_LIST.map(
          (tab) =>
            tab.shouldRender(isEnabled) && (
              <div key={tab.key} className="relative h-full flex items-center transition-all duration-300">
                {pathname.includes(tab.key) && (
                  <span className="absolute bottom-0 w-[80%] left-1/2 -translate-x-1/2 h-0.5 bg-(--text-color-icon-primary) rounded-t-md transition-all duration-300" />
                )}
                <Link key={tab.key} href={`/${workspaceSlug}/archives/${tab.key}`}>
                  <TabNavigationItem isActive={pathname.includes(tab.key)}>{tab.label}</TabNavigationItem>
                </Link>
              </div>
            )
        )}
      </TabNavigationList>
    </>
  );
});
