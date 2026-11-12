/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { useParams } from "react-router";
// plane imports
import { List } from "@makeplane/propel/components/list";
import {
  EUserPermissionsLevel,
  GROUPED_WORKSPACE_SETTINGS,
  WORKSPACE_SETTINGS_CATEGORIES,
  WORKSPACE_SETTINGS_CATEGORY_LABELS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { joinUrlPath } from "@plane/utils";
// components
import { SettingsSidebarItem } from "@/components/settings/sidebar/item";
import { SettingsSidebarSectionHeading } from "@/components/settings/sidebar/section-heading";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { WORKSPACE_SETTINGS_ICONS } from "./item-icon";

export const WorkspaceSettingsSidebarItemCategories = observer(function WorkspaceSettingsSidebarItemCategories() {
  // params
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  // translation
  const { t } = useTranslation();

  return (
    <div className="mt-1.5 flex flex-col divide-y divide-subtle px-3 pb-2">
      {WORKSPACE_SETTINGS_CATEGORIES.map((category) => {
        const categoryItems = GROUPED_WORKSPACE_SETTINGS[category];
        const accessibleItems = categoryItems.filter((item) =>
          allowPermissions(item.access, EUserPermissionsLevel.WORKSPACE, workspaceSlug)
        );

        if (accessibleItems.length === 0) return null;

        return (
          <div key={category} className="shrink-0 py-3 first:pt-0 last:pb-0">
            <SettingsSidebarSectionHeading>
              {t(WORKSPACE_SETTINGS_CATEGORY_LABELS[category])}
            </SettingsSidebarSectionHeading>
            <List gap="px" role="toolbar" aria-label={t(WORKSPACE_SETTINGS_CATEGORY_LABELS[category])}>
              {accessibleItems.map((item) => {
                const isItemActive =
                  item.href === "/settings"
                    ? pathname === `/${workspaceSlug}${item.href}/`
                    : new RegExp(`^/${workspaceSlug}${item.href}/`).test(pathname);

                return (
                  <SettingsSidebarItem
                    key={item.key}
                    as="link"
                    href={joinUrlPath(workspaceSlug ?? "", item.href)}
                    isActive={isItemActive}
                    icon={WORKSPACE_SETTINGS_ICONS[item.key]}
                    label={t(item.i18n_label)}
                  />
                );
              })}
            </List>
          </div>
        );
      })}
    </div>
  );
});
