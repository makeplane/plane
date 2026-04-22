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

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TabNavigationList, TabNavigationItem } from "@plane/propel/tab-navigation";
// local imports
import { ProjectPermissionsTab } from "./project-permissions-tab";
import { WorkspacePermissionsTab } from "./workspace-permissions-tab";

type Props = {
  workspaceSlug: string;
};

type TabKey = "workspace" | "project";

const TABS: { key: TabKey; i18nLabel: string }[] = [
  { key: "workspace", i18nLabel: "workspace_settings.settings.permissions.tabs.workspace" },
  { key: "project", i18nLabel: "workspace_settings.settings.permissions.tabs.project" },
];

export const UserPermissionsView = observer(function UserPermissionsView({ workspaceSlug }: Props) {
  // router hooks
  const [searchParams, setSearchParams] = useSearchParams();
  // plane hooks
  const { t } = useTranslation();

  const activeTab = useMemo<TabKey>(() => {
    const tab = searchParams.get("tab");
    return tab === "project" ? "project" : "workspace";
  }, [searchParams]);

  const handleTabChange = useCallback(
    (tab: TabKey) => {
      setSearchParams({ tab }, { replace: true });
    },
    [setSearchParams]
  );

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-subtle">
        <TabNavigationList>
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)} className="relative">
              <TabNavigationItem isActive={activeTab === tab.key}>{t(tab.i18nLabel)}</TabNavigationItem>
              {activeTab === tab.key && (
                <span className="absolute -bottom-2 w-full left-1/2 -translate-x-1/2 h-0.5 bg-(--text-color-icon-primary) rounded-t-md transition-all duration-300" />
              )}
            </button>
          ))}
        </TabNavigationList>
      </div>
      <div className="mt-6">
        {activeTab === "workspace" && <WorkspacePermissionsTab workspaceSlug={workspaceSlug} />}
        {activeTab === "project" && <ProjectPermissionsTab workspaceSlug={workspaceSlug} />}
      </div>
    </div>
  );
});
