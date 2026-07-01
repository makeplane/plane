/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
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

type TEditProjectTemplatesHeaderProps = {
  workspaceSlug: string;
};

/**
 * Two-segment breadcrumb for /settings/templates/:id/edit:
 *   Project Templates -> Edit template
 */
export const EditProjectTemplateSettingsHeader = observer(function EditProjectTemplateSettingsHeader(
  props: TEditProjectTemplatesHeaderProps
) {
  const { workspaceSlug } = props;
  // translation
  const { t } = useTranslation();
  // derived values
  const settingsDetails = WORKSPACE_SETTINGS["project-templates"];
  const Icon = WORKSPACE_SETTINGS_ICONS["project-templates"];

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
                  href={`/${workspaceSlug}/settings/templates`}
                />
              }
            />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink label={t("workspace_settings.settings.project_templates.editor.edit_title")} />
              }
            />
          </Breadcrumbs>
        </div>
      }
    />
  );
});
