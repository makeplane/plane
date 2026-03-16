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

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TabNavigationList, TabNavigationItem } from "@plane/propel/tab-navigation";
// local
import { ReleasesTagList } from "./tags/list";
import { ReleasesLabelList } from "./labels/list";
import { cn } from "@plane/utils";

type TActiveTab = "tags" | "labels";

type Props = {
  workspaceSlug: string;
};

export const ReleasesSettingsRoot = observer(function ReleasesSettingsRoot({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TActiveTab>("tags");

  return (
    <div className="mt-8">
      <div className="flex items-center h-full flex-1 min-w-0 overflow-hidden border-b border-subtle">
        <TabNavigationList className="h-full">
          <button
            onClick={() => setActiveTab("tags")}
            className={cn("relative pb-2 border-b-2", activeTab === "tags" ? "border-primary" : "border-transparent")}
          >
            <TabNavigationItem isActive={activeTab === "tags"}>
              <span>{t("releases.settings.tabs.tags")}</span>
            </TabNavigationItem>
          </button>
          <button
            onClick={() => setActiveTab("labels")}
            className={cn(
              "relative pb-2",
              activeTab === "labels" ? "border-b-2 border-primary" : "border-b-2 border-transparent"
            )}
          >
            <TabNavigationItem isActive={activeTab === "labels"}>
              <span>{t("releases.settings.tabs.labels")}</span>
            </TabNavigationItem>
          </button>
        </TabNavigationList>
      </div>
      <div className="mt-6">
        {activeTab === "tags" && <ReleasesTagList workspaceSlug={workspaceSlug} />}
        {activeTab === "labels" && <ReleasesLabelList workspaceSlug={workspaceSlug} />}
      </div>
    </div>
  );
});
