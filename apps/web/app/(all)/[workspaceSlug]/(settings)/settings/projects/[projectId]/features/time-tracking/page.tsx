/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { ToggleSwitch } from "@plane/ui";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { getTimeTrackingErrorMessage } from "@/components/time-tracking/helpers";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useProjectTimeSettings } from "@/hooks/time-tracking/use-project-time-settings";
// local imports
import type { Route } from "./+types/page";
import { FeaturesTimeTrackingProjectSettingsHeader } from "./header";

function FeaturesTimeTrackingSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  const { t } = useTranslation();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentProjectDetails } = useProject();
  const { settings, updateSettings } = useProjectTimeSettings(workspaceSlug, projectId);

  const pageTitle = currentProjectDetails?.name
    ? `${currentProjectDetails?.name} settings - ${t("project_settings.features.time_tracking.short_title")}`
    : undefined;
  const canPerformProjectAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  if (workspaceUserInfo && !canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  const handleToggle = async (value: boolean) => {
    try {
      await updateSettings({ default_billable: value });
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("time-tracking.toasts.settings_saved") });
    } catch (error) {
      setToast({ type: TOAST_TYPE.ERROR, title: getTimeTrackingErrorMessage(t, error) });
    }
  };

  return (
    <SettingsContentWrapper header={<FeaturesTimeTrackingProjectSettingsHeader />}>
      <PageHead title={pageTitle} />
      <section className="w-full">
        <SettingsHeading
          title={t("project_settings.features.time_tracking.title")}
          description={t("project_settings.features.time_tracking.description")}
        />
        <div className="mt-7 flex items-center justify-between gap-4 border-b border-subtle pb-4">
          <div className="flex flex-col gap-1">
            <h4 className="text-14 font-medium text-primary">{t("time-tracking.settings.default_billable")}</h4>
            <p className="text-13 text-tertiary">{t("time-tracking.settings.default_billable_description")}</p>
          </div>
          <ToggleSwitch
            value={!!settings?.default_billable}
            onChange={(value) => void handleToggle(value)}
            disabled={!settings}
            size="sm"
          />
        </div>
      </section>
    </SettingsContentWrapper>
  );
}

export default observer(FeaturesTimeTrackingSettingsPage);
