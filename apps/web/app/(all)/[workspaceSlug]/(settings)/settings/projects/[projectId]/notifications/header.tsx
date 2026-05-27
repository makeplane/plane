/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { observer } from "mobx-react";
import { PROJECT_SETTINGS } from "@plane/constants";
import { Breadcrumbs } from "@plane/ui";

import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SettingsPageHeader } from "@/components/settings/page-header";
import { PROJECT_SETTINGS_ICONS } from "@/components/settings/project/sidebar/item-icon";

export const NotificationsProjectSettingsHeader = observer(function NotificationsProjectSettingsHeader() {
  const settingsDetails = PROJECT_SETTINGS.notifications;
  const Icon = PROJECT_SETTINGS_ICONS.notifications;

  return (
    <SettingsPageHeader
      leftItem={
        <div className="flex items-center gap-2">
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink label={settingsDetails.i18n_label} icon={<Icon className="size-4 text-tertiary" />} />
              }
            />
          </Breadcrumbs>
        </div>
      }
    />
  );
});
