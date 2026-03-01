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
// plane imports
import { WORKSPACE_SETTINGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Breadcrumbs } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SettingsPageHeader } from "@/components/settings/page-header";
import { WORKSPACE_SETTINGS_ICONS } from "@/components/settings/workspace/sidebar/item-icon";
import { useParams, usePathname } from "next/navigation";
import { useRunners } from "@/plane-web/hooks/store";

export const ScriptsWorkspaceSettingsHeader = observer(function ScriptsWorkspaceSettingsHeader() {
  // plane hooks
  const { t } = useTranslation();
  const { getScriptById } = useRunners();
  const { workspaceSlug, scriptId } = useParams();
  const pathname = usePathname();
  // derived values
  const settingsDetails = WORKSPACE_SETTINGS.scripts;
  const Icon = WORKSPACE_SETTINGS_ICONS.scripts;
  const isNewScript = `/${workspaceSlug}/settings/runner/scripts/new/` === pathname;
  const scriptName = scriptId ? getScriptById(scriptId)?.name : undefined;

  return (
    <SettingsPageHeader
      leftItem={
        <div className="flex items-center gap-2">
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label={t(settingsDetails.i18n_label)}
                  icon={<Icon className="size-4 text-tertiary" />}
                  href={`/${workspaceSlug}/settings/runner/?tab=scripts`}
                />
              }
            />
            {isNewScript && (
              <Breadcrumbs.Item
                component={<BreadcrumbLink label={t("workspace_settings.settings.runners.new_script")} />}
              />
            )}
            {scriptId && <Breadcrumbs.Item component={<BreadcrumbLink label={scriptName} />} />}
          </Breadcrumbs>
        </div>
      }
    />
  );
});
