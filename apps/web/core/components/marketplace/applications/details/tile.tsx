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
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Crown } from "lucide-react";
import { InfoIcon } from "@plane/propel/icons";
import { E_FEATURE_FLAGS, EUserPermissionsLevel } from "@plane/constants";
import { convertAppSlugToIntegrationKey } from "@plane/etl/core";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TUserApplication } from "@plane/types";
import { EProductSubscriptionEnum, EUserWorkspaceRoles } from "@plane/types";
import { cn, Tooltip } from "@plane/ui";
import { useUserPermissions } from "@/hooks/store/user";
import { IMPORTERS_LIST } from "@/components/importers/list";
import { ApplicationTileMenuOptions } from "@/components/marketplace";
import { useFlag, useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { OAuthService } from "@/services/marketplace/oauth.service";
import { AppTileLogo } from "./tile-logo";

// display app details like name, logo, description
// button and more options to edit, delete, publish
const oauthService = new OAuthService();

type AppTileProps = {
  app: TUserApplication;
};

export const AppTile = observer(function AppTile(props: AppTileProps) {
  const { app } = props;
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const router = useRouter();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, togglePaidPlanModal } = useWorkspaceSubscription();
  const { allowPermissions } = useUserPermissions();

  // if app is internal check for it's feature flag
  const isAppDefault = app.is_default || false;

  // derived values
  const showConfigureButton = app.is_default;
  const showInstallButton = app.setup_url && (!app.is_installed || !app.is_default);
  const showOptionsButton =
    (app.is_default &&
      app.is_owned &&
      allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE)) ||
    (!app.is_default &&
      (app.is_owned ||
        (allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE) && app.is_installed)));
  const isNotSupported = app.is_not_supported || false;
  const isSelfManaged = subscriptionDetail?.is_self_managed || false;
  const isFreePlan = subscriptionDetail?.product === EProductSubscriptionEnum.FREE;
  const importersSlug = IMPORTERS_LIST.map((importer) => importer.key);
  const isFeatureFlagEnabled = useFlag(
    workspaceSlug?.toString() || "",
    E_FEATURE_FLAGS[`${convertAppSlugToIntegrationKey(app.slug)}_INTEGRATION` as keyof typeof E_FEATURE_FLAGS]
  );

  const handleConfigure = () => {
    if (isAppDefault) {
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

  // for default apps, if the feature flag is not enabled, don't show the tile, or
  // if the app is an importer, don't show the tile, or if the app doesn't have a setup url and is not owned or is not default
  if (
    (isAppDefault && !isFeatureFlagEnabled) ||
    importersSlug.includes(app.slug) ||
    (!app.setup_url && !isAppDefault && !app.is_owned)
  ) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-md bg-layer-2 border border-subtle-1 p-4">
      <div className="shrink-0 size-10 bg-layer-3 rounded-lg grid place-items-center">
        <AppTileLogo app={app} />
      </div>
      <div className="flex flex-col space-y-1 flex-1 w-full">
        <div className="flex gap-2 justify-between w-full">
          <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-1 justify-between">
              {(!isFreePlan || app.is_owned) && (
                <div className="flex gap-1 items-center h-fit">
                  {/* Installed Badge */}
                  {app.is_installed && !app.is_default && (
                    <div className="px-2 text-caption-sm-medium bg-toast-border-success text-toast-text-success rounded-full h-fit">
                      {t("workspace_settings.settings.applications.installed")}
                    </div>
                  )}
                  {/* Internal Badge */}
                  {app.is_owned && (
                    <div className="px-2  text-caption-sm-medium text-tertiary bg-layer-1 rounded-full h-fit">
                      {t("workspace_settings.settings.applications.internal")}
                    </div>
                  )}
                  {/* Three Dots Menu */}
                  {showOptionsButton && (
                    <div className="size-5">
                      <ApplicationTileMenuOptions app={app} />{" "}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="text-body-sm-medium">{app.name}</div>
          </div>
        </div>
        <div className="text-body-xs-regular text-secondary flex-1 line-clamp-2">{t(app.short_description)}</div>
      </div>
      <div className="flex items-center gap-x-1 flex-wrap">
        {isFreePlan && !app.is_owned ? (
          <Button
            variant="link"
            onClick={() => togglePaidPlanModal(true)}
            className="px-0"
            prependIcon={<Crown className="size-3.5" />}
          >
            {t("common.upgrade")}
          </Button>
        ) : (
          <>
            {showInstallButton && (
              <Button
                variant={app.is_installed ? "link" : "secondary"}
                className={cn(app.is_installed && "p-0")}
                onClick={handleInstall}
              >
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
                  <div className="shrink-0 flex items-center gap-1 cursor-help text-tertiary">
                    <InfoIcon className="shrink-0 size-3.5" />
                    <span className="text-body-xs-medium">{t("integrations.not_configured")}</span>
                  </div>
                </Tooltip>
              ) : (
                <Button variant="ghost" onClick={handleConfigure} appendIcon={<ArrowRight className="size-3.5" />}>
                  {t("workspace_settings.settings.applications.configure")}
                </Button>
              ))}
          </>
        )}
      </div>
    </div>
  );
});
