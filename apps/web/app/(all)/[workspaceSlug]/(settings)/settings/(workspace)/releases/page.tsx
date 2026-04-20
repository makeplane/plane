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
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setPromiseToast } from "@plane/propel/toast";
import { Switch } from "@plane/propel/switch";
// components
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { ReleasesSettingsRoot } from "@/components/releases/settings/root";
import { useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
// local imports
import type { Route } from "./+types/page";
import { ReleasesWorkspaceSettingsHeader } from "./header";

function ReleasesSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { updateWorkspaceFeature, isWorkspaceFeatureEnabled } = useWorkspaceFeatures();

  const { t } = useTranslation();

  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Releases` : undefined;
  const isReleasesEnabled = isWorkspaceFeatureEnabled(workspaceSlug, EWorkspaceFeatures.IS_RELEASES_ENABLED);
  const isFeatureFlagEnabled = useFlag(workspaceSlug, E_FEATURE_FLAGS.RELEASES);

  if (!currentWorkspace?.id) return <></>;

  const toggleReleasesFeature = async () => {
    try {
      const payload = {
        [EWorkspaceFeatures.IS_RELEASES_ENABLED]: !isReleasesEnabled,
      };
      const toggleReleasesFeaturePromise = updateWorkspaceFeature(workspaceSlug, payload);
      setPromiseToast(toggleReleasesFeaturePromise, {
        loading: isReleasesEnabled
          ? t("releases.settings.toasts.disable.loading")
          : t("releases.settings.toasts.enable.loading"),
        success: {
          title: isReleasesEnabled
            ? t("releases.settings.toasts.disable.success.title")
            : t("releases.settings.toasts.enable.success.title"),
          message: () =>
            isReleasesEnabled
              ? t("releases.settings.toasts.disable.success.message")
              : t("releases.settings.toasts.enable.success.message"),
        },
        error: {
          title: isReleasesEnabled
            ? t("releases.settings.toasts.disable.error.title")
            : t("releases.settings.toasts.enable.error.title"),
          message: () =>
            isReleasesEnabled
              ? t("releases.settings.toasts.disable.error.message")
              : t("releases.settings.toasts.enable.error.message"),
        },
      });
      await toggleReleasesFeaturePromise;
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SettingsContentWrapper header={<ReleasesWorkspaceSettingsHeader />}>
      <div className="w-full">
        <PageHead title={pageTitle} />
        <SettingsHeading
          title={t("releases.settings.heading.title")}
          description={t("releases.settings.heading.description")}
        />
        <div className="mt-6">
          <SettingsBoxedControlItem
            title={t("releases.settings.toggle.title")}
            description={t("releases.settings.toggle.description")}
            control={isFeatureFlagEnabled && <Switch value={!!isReleasesEnabled} onChange={toggleReleasesFeature} />}
          />
        </div>
        {isReleasesEnabled && <ReleasesSettingsRoot workspaceSlug={workspaceSlug} />}
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(ReleasesSettingsPage);
