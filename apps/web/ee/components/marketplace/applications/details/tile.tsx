"use client";

import React from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CircleCheckBig, Info } from "lucide-react";
import { E_FEATURE_FLAGS, EUserPermissionsLevel } from "@plane/constants";
import { convertAppSlugToIntegrationKey } from "@plane/etl/core";
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles, TUserApplication } from "@plane/types";
import { Button, setToast, TOAST_TYPE, Tooltip } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import { useUserPermissions } from "@/hooks/store/user";
import { ApplicationTileMenuOptions } from "@/plane-web/components/marketplace";
import { useFlag, useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { OAuthService } from "@/plane-web/services/marketplace/oauth.service";

// display app details like name, logo, description
// button and more options to edit, delete, publish
const oauthService = new OAuthService();

type AppTileProps = {
  app: TUserApplication;
};

export const AppTile: React.FC<AppTileProps> = observer((props) => {
  const { app } = props;
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const router = useRouter();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  const { allowPermissions } = useUserPermissions();

  // if app is internal check for it's feature flag
  const isAppInternal = app.is_internal || false;
  const appFeatureFlag = `${convertAppSlugToIntegrationKey(app.slug).toUpperCase()}_INTEGRATION` as E_FEATURE_FLAGS;
  const isFeatureFlagEnabled = useFlag(workspaceSlug?.toString(), appFeatureFlag);
  if (!isFeatureFlagEnabled && isAppInternal) return null;

  // dervied values
  const showConfigureButton = app.is_internal || (app.configuration_url && app.is_installed);
  const showInstallButton = !app.is_internal;
  const showInstalledBadge = app.is_installed && !app.is_internal && !app.configuration_url;
  const isNotSupported = app.is_not_supported || false;
  const isSelfManaged = subscriptionDetail?.is_self_managed || false;

  const handleConfigure = () => {
    if (isAppInternal) {
      router.push(`/${workspaceSlug}/settings/integrations/${app.slug}`);
    } else {
      if (!app.configuration_url) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("error"),
          message: t("workspace_settings.settings.applications.invalid_configuration_url_error"),
        });
        return;
      }
      window.open(app.configuration_url || "", "_blank");
    }
  };

  const handleInstall = () => {
    if (app.setup_url) {
      window.open(app.setup_url || "", "_blank");
    } else {
      const redirectUri = app.redirect_uris?.split(" ")[0];
      if (redirectUri && app.client_id) {
        const authorizationUrl = oauthService.getAuthorizationUrl({
          client_id: app.client_id,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: "read write",
          workspace_slug: workspaceSlug?.toString(),
        });
        window.location.assign(authorizationUrl);
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("workspace_settings.settings.applications.invalid_redirect_uris_error"),
        });
      }
    }
  };

  return (
    <div className="flex flex-col items-start justify-between border border-custom-border-100 p-4 rounded-md gap-2 h-full">
      <div className="flex flex-col space-y-1 flex-1 w-full">
        <div className="flex  gap-2 justify-between w-full">
          <div className="flex flex-col gap-2">
            <div className="rounded-md size-12 justify-center items-center flex bg-custom-background-90">
              {app?.logo_url ? (
                <img
                  src={app.is_hardcoded ? app.logo_url : getFileURL(app.logo_url)}
                  alt={app.name}
                  className="size-9 rounded-full"
                />
              ) : (
                <div className="size-9 rounded-full bg-custom-background-80 flex items-center justify-center">
                  <div className="text-lg font-medium">{app.name.charAt(0)}</div>
                </div>
              )}
            </div>

            <div className="text-lg font-medium">{app.name}</div>
            {showInstalledBadge && (
              <div className="flex items-center space-x-1">
                <div>
                  <CircleCheckBig className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-sm text-custom-text-350 font-medium">
                  {t("workspace_settings.settings.applications.installed")}
                </div>
              </div>
            )}
          </div>
          <div className="size-5">
            {(app.is_owned ||
              (allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE) && app.is_installed)) && (
              <ApplicationTileMenuOptions app={app} />
            )}
          </div>
        </div>

        <div className="text-sm text-custom-text-200 flex-1">{t(app.short_description)}</div>
      </div>

      <div className="flex items-center space-x-1 mt-1">
        {showInstallButton && (
          <Button size="sm" variant="outline-primary" onClick={handleInstall}>
            {app.is_installed
              ? t("workspace_settings.settings.applications.go_to_app")
              : t("workspace_settings.settings.applications.install")}
          </Button>
        )}

        {showConfigureButton &&
          (isNotSupported ? (
            <Tooltip
              tooltipContent={
                isSelfManaged
                  ? t("integrations.not_configured_message_admin", { name: app.name })
                  : t("integrations.not_configured_message_support", {
                      name: app.name,
                    })
              }
            >
              <div className="flex gap-1.5 cursor-help flex-shrink-0 items-center text-custom-text-200">
                <Info size={12} />
                <div className="text-xs">{t("integrations.not_configured")}</div>
              </div>
            </Tooltip>
          ) : (
            <Button size="sm" variant="neutral-primary" onClick={handleConfigure}>
              {t("workspace_settings.settings.applications.configure")}
            </Button>
          ))}
      </div>
    </div>
  );
});
