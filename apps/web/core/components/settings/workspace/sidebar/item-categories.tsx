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
import { usePathname } from "next/navigation";
// plane imports
import { GROUPED_WORKSPACE_SETTINGS, WORKSPACE_SETTINGS_CATEGORIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { joinUrlPath } from "@plane/utils";
// components
import { BetaBadge } from "@/components/common/beta";
import { SettingsSidebarItem } from "@/components/settings/sidebar/item";
// helpers
import { shouldRenderSettingLink } from "@/helpers/settings/workspace";
// hooks
import { useWorkspaceSettingsAccess } from "@/hooks/permissions/use-workspace-settings-access";
// local imports
import { WORKSPACE_SETTINGS_ICONS } from "./item-icon";

type Props = {
  workspaceSlug: string;
};

export const WorkspaceSettingsSidebarItemCategories = observer(function WorkspaceSettingsSidebarItemCategories(
  props: Props
) {
  const { workspaceSlug } = props;
  // router
  const pathname = usePathname();
  // store hooks
  const { canAccessWorkspaceSetting } = useWorkspaceSettingsAccess();
  // translation
  const { t } = useTranslation();

  return (
    <div className="mt-1.5 flex flex-col divide-y divide-subtle px-3">
      {WORKSPACE_SETTINGS_CATEGORIES.map((category) => {
        const categoryItems = GROUPED_WORKSPACE_SETTINGS[category];
        const accessibleItems = categoryItems.filter(
          (item) =>
            canAccessWorkspaceSetting(workspaceSlug, item.key) && shouldRenderSettingLink(workspaceSlug, item.key)
        );

        if (accessibleItems.length === 0) return null;
        return (
          <div key={category} className="shrink-0 py-3 first:pt-0 last:pb-0">
            <div className="p-2 text-caption-md-medium text-tertiary capitalize">{t(category)}</div>
            <div className="flex flex-col">
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
                    appendContent={item.beta && <BetaBadge />}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
});
