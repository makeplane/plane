/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setPromiseToast } from "@plane/propel/toast";
import { ToggleSwitch } from "@plane/ui";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import type { Route } from "./+types/page";
import { BankWideProjectSettingsHeader } from "./header";

function BankWideProjectSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  const { t } = useTranslation();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentProjectDetails, updateProject } = useProject();

  const canPerformProjectAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  const pageTitle = currentProjectDetails?.name
    ? `${currentProjectDetails.name} settings - ${t("bank_wide_project.settings.title")}`
    : undefined;

  const handleToggle = () => {
    if (!currentProjectDetails) return;

    const updateProjectPromise = updateProject(workspaceSlug, projectId, {
      is_bank_wide: !currentProjectDetails.is_bank_wide,
    });

    setPromiseToast(updateProjectPromise, {
      loading: t("common.updating"),
      success: {
        title: t("toast.success"),
        message: () => t("bank_wide_project.settings.updated_success"),
      },
      error: {
        title: t("toast.error"),
        message: () => t("bank_wide_project.settings.updated_error"),
      },
    });
  };

  if (workspaceUserInfo && !canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<BankWideProjectSettingsHeader />}>
      <PageHead title={pageTitle} />
      <section className="w-full">
        <SettingsHeading
          title={t("bank_wide_project.settings.title")}
          description={t("bank_wide_project.settings.header_description")}
        />
        <div className="mt-7">
          <SettingsBoxedControlItem
            title={t("bank_wide_project.settings.label")}
            description={t("bank_wide_project.settings.description")}
            control={
              <ToggleSwitch
                value={!!currentProjectDetails?.is_bank_wide}
                onChange={handleToggle}
                disabled={!canPerformProjectAdminActions}
                size="sm"
              />
            }
          />
        </div>
      </section>
    </SettingsContentWrapper>
  );
}

export default observer(BankWideProjectSettingsPage);
