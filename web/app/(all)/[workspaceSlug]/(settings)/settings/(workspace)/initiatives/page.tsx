"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserWorkspaceRoles } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// component
import { InitiativeIcon, setPromiseToast, ToggleSwitch } from "@plane/ui";
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
import { SettingsContentWrapper, SettingsHeading } from "@/components/settings";
// store hooks
import { useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web imports
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { InitiativesUpgrade } from "@/plane-web/components/initiatives/upgrade";
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";

const InitiativesSettingsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { isWorkspaceFeatureEnabled, updateWorkspaceFeature } = useWorkspaceFeatures();

  const { t } = useTranslation();

  // derived values
  const currentWorkspaceRole = getWorkspaceRoleByWorkspaceSlug(workspaceSlug.toString());
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Initiatives` : undefined;
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;
  const isInitiativesFeatureEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_INITIATIVES_ENABLED);

  if (!workspaceSlug || !currentWorkspace?.id) return <></>;

  if (!isAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

  const toggleInitiativesFeature = async () => {
    try {
      const payload = {
        [EWorkspaceFeatures.IS_INITIATIVES_ENABLED]: !isInitiativesFeatureEnabled,
      };
      const toggleInitiativesFeaturePromise = updateWorkspaceFeature(workspaceSlug.toString(), payload);
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
    <SettingsContentWrapper>
      <div className="w-full">
        <PageHead title={pageTitle} />
        <SettingsHeading
          title={t("workspace_settings.settings.initiatives.heading")}
          description={t("workspace_settings.settings.initiatives.description")}
        />
        <WithFeatureFlagHOC
          flag="INITIATIVES"
          fallback={<InitiativesUpgrade workspaceSlug={workspaceSlug?.toString()} redirect />}
          workspaceSlug={workspaceSlug?.toString()}
        >
          <div className="px-4 py-6 flex items-center justify-between gap-2 border-b border-custom-border-100 w-full">
            <div className="flex items-center gap-4">
              <div className="size-10 bg-custom-background-90 rounded-md flex items-center justify-center">
                <InitiativeIcon className="size-5 text-custom-text-300" />
              </div>
              <div className="leading-tight">
                <h5 className="font-medium">{t("project_settings.initiatives.title")}</h5>
                <span className="text-custom-sidebar-text-400 text-sm">
                  {t("project_settings.initiatives.description")}
                </span>
              </div>
            </div>
            <ToggleSwitch value={isInitiativesFeatureEnabled} onChange={toggleInitiativesFeature} size="sm" />
          </div>
        </WithFeatureFlagHOC>
      </div>
    </SettingsContentWrapper>
  );
});

export default InitiativesSettingsPage;
