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
import { PiIcon } from "@plane/propel/icons";
import { setPromiseToast } from "@plane/propel/toast";
import { Switch } from "@plane/propel/switch";
import { EUserWorkspaceRoles } from "@plane/types";
// component
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// store hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { PiChatUpgrade } from "@/components/pi-chat/upgrade";
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
// local imports
import type { Route } from "./+types/page";
import { PlaneAIWorkspaceSettingsHeader } from "./header";
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";

function PlaneIntelligenceSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  // store hooks
  const { getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { isWorkspaceFeatureEnabled, updateWorkspaceFeature } = useWorkspaceFeatures();
  const { t } = useTranslation();

  // derived values
  const currentWorkspaceRole = getWorkspaceRoleByWorkspaceSlug(workspaceSlug);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Plane Intelligence` : undefined;
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;
  const isPlaneIntelligenceFeatureEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PI_ENABLED);

  if (!currentWorkspace?.id) return <></>;

  if (!isAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

  const toggleTeamsFeature = async () => {
    try {
      const payload = {
        [EWorkspaceFeatures.IS_PI_ENABLED]: !isPlaneIntelligenceFeatureEnabled,
      };
      const toggleTeamsFeaturePromise = updateWorkspaceFeature(workspaceSlug, payload);
      setPromiseToast(toggleTeamsFeaturePromise, {
        loading: "Updating Plane Intelligence feature...",
        success: {
          title: "Success",
          message: () => `AI feature ${isPlaneIntelligenceFeatureEnabled ? "disabled" : "enabled"} successfully!`,
        },
        error: {
          title: "Error",
          message: () => "Failed to update Plane Intelligence feature!",
        },
      });
      await toggleTeamsFeaturePromise;
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SettingsContentWrapper header={<PlaneAIWorkspaceSettingsHeader />}>
      <PageHead title={pageTitle} />
      <SettingsHeading title="Plane AI" description={t("workspace_settings.settings.plane-intelligence.description")} />
      <WithFeatureFlagHOC
        flag={E_FEATURE_FLAGS.AI_CHAT || E_FEATURE_FLAGS.AI_DEDUPE || E_FEATURE_FLAGS.EDITOR_AI_OPS}
        fallback={<PiChatUpgrade />}
        workspaceSlug={workspaceSlug}
      >
        <div className="mt-6">
          <SettingsBoxedControlItem
            title="Turn on AI for this workspace."
            description="Your new smart teammate, ready when you are."
            control={<Switch value={isPlaneIntelligenceFeatureEnabled} onChange={toggleTeamsFeature} />}
          />
        </div>
      </WithFeatureFlagHOC>
    </SettingsContentWrapper>
  );
}

export default observer(PlaneIntelligenceSettingsPage);
