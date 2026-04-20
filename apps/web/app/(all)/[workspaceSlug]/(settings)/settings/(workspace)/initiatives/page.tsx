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
import { useTranslation } from "@plane/i18n";
import { setPromiseToast } from "@plane/propel/toast";
import { Switch } from "@plane/propel/switch";
// component
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { InitiativeLabelList } from "@/components/initiatives/components/labels/initiative-label-list";
import { InitiativesUpgrade } from "@/components/initiatives/upgrade";
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
// local imports
import type { Route } from "./+types/page";
import { InitiativesWorkspaceSettingsHeader } from "./header";

function InitiativesSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const { isWorkspaceFeatureEnabled, updateWorkspaceFeature } = useWorkspaceFeatures();
  const { t } = useTranslation();
  // derived values
  const currentWorkspace = getWorkspaceBySlug(workspaceSlug);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Initiatives` : undefined;
  const isInitiativesFeatureEnabled = isWorkspaceFeatureEnabled(
    workspaceSlug,
    EWorkspaceFeatures.IS_INITIATIVES_ENABLED
  );

  const toggleInitiativesFeature = async () => {
    try {
      const payload = {
        [EWorkspaceFeatures.IS_INITIATIVES_ENABLED]: !isInitiativesFeatureEnabled,
      };
      const toggleInitiativesFeaturePromise = updateWorkspaceFeature(workspaceSlug, payload);
      setPromiseToast(toggleInitiativesFeaturePromise, {
        loading: t("project_settings.initiatives.toast.updating"),
        success: {
          title: t("toast.success"),
          message: () =>
            `${isInitiativesFeatureEnabled ? t("project_settings.initiatives.toast.disable_success") : t("project_settings.initiatives.toast.enable_success")}`,
        },
        error: {
          title: t("toast.error"),
          message: () => t("project_settings.initiatives.toast.error"),
        },
      });
      await toggleInitiativesFeaturePromise;
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SettingsContentWrapper header={<InitiativesWorkspaceSettingsHeader />}>
      <div className="w-full">
        <PageHead title={pageTitle} />
        <SettingsHeading
          title={t("workspace_settings.settings.initiatives.heading")}
          description={t("workspace_settings.settings.initiatives.description")}
        />
        <WithFeatureFlagHOC
          flag="INITIATIVES"
          fallback={<InitiativesUpgrade workspaceSlug={workspaceSlug} redirect />}
          workspaceSlug={workspaceSlug}
        >
          <div className="mt-6">
            <SettingsBoxedControlItem
              title={t("project_settings.initiatives.title")}
              description={t("project_settings.initiatives.description")}
              control={<Switch value={isInitiativesFeatureEnabled} onChange={toggleInitiativesFeature} />}
            />
          </div>
          <div className="mt-12">
            <InitiativeLabelList workspaceSlug={workspaceSlug} />
          </div>
        </WithFeatureFlagHOC>
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(InitiativesSettingsPage);
