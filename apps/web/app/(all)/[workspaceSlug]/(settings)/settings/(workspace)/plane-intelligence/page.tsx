"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import {
  E_FEATURE_FLAGS,
  PLANE_INTELLIGENCE_TRACKER_ELEMENTS,
  PLANE_INTELLIGENCE_TRACKER_EVENTS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { PiIcon } from "@plane/propel/icons";
import { EUserWorkspaceRoles } from "@plane/types";
import { setPromiseToast, ToggleSwitch } from "@plane/ui";
// component
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// store hooks
import { captureClick, captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { PiChatUpgrade } from "@/plane-web/components/pi-chat/upgrade";
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";

const PlaneIntelligenceSettingsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { isWorkspaceFeatureEnabled, updateWorkspaceFeature } = useWorkspaceFeatures();
  const { t } = useTranslation();

  // derived values
  const currentWorkspaceRole = getWorkspaceRoleByWorkspaceSlug(workspaceSlug.toString());
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Plane Intelligence` : undefined;
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;
  const isPlaneIntelligenceFeatureEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PI_ENABLED);

  if (!workspaceSlug || !currentWorkspace?.id) return <></>;

  if (!isAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

  const toggleTeamsFeature = async () => {
    try {
      captureClick({
        elementName: PLANE_INTELLIGENCE_TRACKER_ELEMENTS.SETTINGS_PAGE_TOGGLE_BUTTON,
      });
      const payload = {
        [EWorkspaceFeatures.IS_PI_ENABLED]: !isPlaneIntelligenceFeatureEnabled,
      };
      const toggleTeamsFeaturePromise = updateWorkspaceFeature(workspaceSlug.toString(), payload);
      setPromiseToast(toggleTeamsFeaturePromise, {
        loading: "Updating Plane Intelligence feature...",
        success: {
          title: "Success",
          message: () => `Pi feature ${isPlaneIntelligenceFeatureEnabled ? "disabled" : "enabled"} successfully!`,
        },
        error: {
          title: "Error",
          message: () => "Failed to update Plane Intelligence feature!",
        },
      });
      await toggleTeamsFeaturePromise;
      captureSuccess({
        eventName: PLANE_INTELLIGENCE_TRACKER_EVENTS.TOGGLE,
        payload: {
          workspace_slug: workspaceSlug.toString(),
          type: isPlaneIntelligenceFeatureEnabled ? "disable" : "enable",
        },
      });
    } catch (error) {
      console.error(error);
      captureError({
        eventName: PLANE_INTELLIGENCE_TRACKER_EVENTS.TOGGLE,
        payload: {
          workspace_slug: workspaceSlug.toString(),
          type: isPlaneIntelligenceFeatureEnabled ? "disable" : "enable",
        },
      });
    }
  };

  return (
    <SettingsContentWrapper>
      <PageHead title={pageTitle} />
      <SettingsHeading title="Pi" description={t("workspace_settings.settings.plane-intelligence.description")} />
      <WithFeatureFlagHOC
        flag={E_FEATURE_FLAGS.PI_CHAT || E_FEATURE_FLAGS.PI_DEDUPE || E_FEATURE_FLAGS.EDITOR_AI_OPS}
        fallback={<PiChatUpgrade />}
        workspaceSlug={workspaceSlug?.toString()}
      >
        <div className="px-4 py-6 flex items-center justify-between gap-2 border-b border-custom-border-100 w-full">
          <div className="flex items-center gap-4">
            <div className="size-10 bg-custom-background-90 rounded-md flex items-center justify-center">
              <PiIcon className="size-5 text-custom-text-300" />
            </div>
            <div className="leading-tight">
              <h5 className="font-medium">Turn on Pi for this workspace.</h5>
              <span className="text-custom-sidebar-text-400 text-sm">
                Your new smart teammate, ready when you are.{" "}
              </span>
            </div>
          </div>

          <div>
            <ToggleSwitch value={isPlaneIntelligenceFeatureEnabled} onChange={toggleTeamsFeature} size="sm" />
          </div>
        </div>
      </WithFeatureFlagHOC>
    </SettingsContentWrapper>
  );
});

export default PlaneIntelligenceSettingsPage;
