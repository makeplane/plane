/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "react-router";
import { WORKSPACE_SETTINGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Breadcrumbs } from "@plane/ui";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SettingsPageHeader } from "@/components/settings/page-header";
import { WORKSPACE_SETTINGS_ICONS } from "@/components/settings/workspace/sidebar/item-icon";

export const JiraImportsWorkspaceSettingsHeader = observer(function JiraImportsWorkspaceSettingsHeader() {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const settingsDetails = WORKSPACE_SETTINGS.imports;
  const Icon = WORKSPACE_SETTINGS_ICONS.imports;

  return (
    <SettingsPageHeader
      leftItem={
        <div className="flex items-center gap-2">
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  href={workspaceSlug ? `/${workspaceSlug}/settings/imports` : undefined}
                  label={t(settingsDetails.i18n_label)}
                  icon={<Icon className="size-4 text-tertiary" />}
                />
              }
            />
            <Breadcrumbs.Item
              component={<BreadcrumbLink label={t("workspace_settings.settings.imports.jira.title")} isLast />}
            />
          </Breadcrumbs>
        </div>
      }
    />
  );
});
