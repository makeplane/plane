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

import React from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { API_BASE_URL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TUserApplication } from "@plane/types";
import { getFileURL } from "@plane/utils";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { OAuthService } from "@/services/marketplace";

type ApplicationInstallationDetailsProps = {
  app: TUserApplication;
};

enum EntityType {
  USER = "user",
  WORKSPACE = "workspace",
}

type ApplicationPermission = {
  i18n_description: string;
  key: string;
  scope: string;
  enitity_type: string;
};

export const permissions: ApplicationPermission[] = [
  {
    i18n_description: "workspace_settings.settings.applications.read_only_access_to_workspace",
    key: "read:workspace",
    scope: "workspace",
    enitity_type: EntityType.WORKSPACE,
  },
  {
    i18n_description: "workspace_settings.settings.applications.write_access_to_workspace",
    key: "write:workspace",
    scope: "workspace",
    enitity_type: EntityType.WORKSPACE,
  },
  {
    i18n_description: "workspace_settings.settings.applications.read_only_access_to_user_profile",
    key: "read:user",
    scope: "user",
    enitity_type: EntityType.USER,
  },
  {
    i18n_description: "workspace_settings.settings.applications.write_access_to_user_profile",
    key: "write:user",
    scope: "user",
    enitity_type: EntityType.USER,
  },
];

// in future we'll store permissions for the app in the above format
export const userLevelPermissions = permissions.filter((permission) => permission.enitity_type === EntityType.USER);
export const workspaceLevelPermissions = permissions.filter(
  (permission) => permission.enitity_type === EntityType.WORKSPACE
);

export const ApplicationInstallationDetails = observer(function ApplicationInstallationDetails(
  props: ApplicationInstallationDetailsProps
) {
  const { app } = props;
  const { currentWorkspace } = useWorkspace();

  const { t } = useTranslation();

  const handleNext = () => {
    const redirectUri = app.redirect_uris.split(" ")[0];
    if (redirectUri && app.client_id) {
      const oauthService = new OAuthService();
      const authorizationUrl = oauthService.getAuthorizationUrl({
        client_id: app.client_id,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "read write",
        workspace_slug: currentWorkspace?.slug,
      });
      window.location.assign(authorizationUrl);
    } else {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.applications.invalid_redirect_uris_error"),
      });
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        {app?.logo_url ? (
          <img src={getFileURL(app?.logo_url)} alt={app.name} className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-layer-1 flex items-center justify-center">
            <div className="text-16 font-medium">{app.name?.charAt(0)}</div>
          </div>
        )}{" "}
        <div className="text-16 font-medium">{app.name}</div>
      </div>
      <div className="text-13 text-primary">{app.short_description}</div>
      <div className="flex flex-col space-y-2 bg-layer-1 p-4 rounded-xl mt-6">
        <div>
          {t("workspace_settings.settings.applications.connect_app_to_workspace", {
            app: app.name,
            workspace: currentWorkspace?.name,
          })}
        </div>
        <div className="text-13 text-secondary border-b border-subtle-1">
          {t("workspace_settings.settings.applications.with_the_permissions")}
        </div>
        <div className="flex flex-col space-y-2 py-2 border-b border-subtle-1">
          {workspaceLevelPermissions.map((permission) => (
            <ApplicationPermissionText key={permission.key} permission={permission} />
          ))}
        </div>
        <div>{t("workspace_settings.settings.applications.user_permissions")}</div>
        <div className="text-13 text-secondary">
          {t("workspace_settings.settings.applications.user_permissions_description")}
        </div>
        <div className="flex flex-col space-y-2">
          {userLevelPermissions.map((permission) => (
            <ApplicationPermissionText key={permission.key} permission={permission} />
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Link href={`/${currentWorkspace?.slug}/settings/integrations`}>
          <Button variant="secondary" className="bg-surface-1">
            {t("common.cancel")}
          </Button>
        </Link>
        <Button variant="primary" onClick={handleNext}>
          {t("common.next")}
        </Button>
      </div>
    </div>
  );
});

export function ApplicationPermissionText(props: { permission: ApplicationPermission }) {
  const { permission } = props;
  const { t } = useTranslation();
  return (
    <div className="flex items-center space-x-2">
      <CheckCircle className="h-3 w-3" />
      <div className="text-13 text-primary">{t(permission.i18n_description)}</div>
    </div>
  );
}

export function ApplicationPermissionTextWithResources(props: { accessText: string; resources: string[] }) {
  const { accessText, resources } = props;
  if (resources.length === 0) return null;
  return (
    <div className="flex items-start space-x-4">
      <div className="flex items-center space-x-2 w-1/4">
        <CheckCircle className="h-3 w-3" />
        <div className="text-13 text-primary">{accessText}</div>
      </div>
      <div className="flex flex-row space-x-2 flex-wrap space-y-2 w-3/4">
        {resources.map((resource) => (
          <div
            key={resource}
            className="text-11 text-tertiary font-medium border border-subtle-1 rounded-md px-2 py-0.5 bg-layer-1"
          >
            {resource}
          </div>
        ))}
      </div>
    </div>
  );
}
