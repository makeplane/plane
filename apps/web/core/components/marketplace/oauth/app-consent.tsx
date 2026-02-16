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

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { CircleAlert } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { ChevronDownIcon, PlaneLogo } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { IWorkspace, TUserApplication } from "@plane/types";
import { cn, CustomMenu } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import ConnectSvg from "@/app/assets/marketplace/connect.svg?url";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser } from "@/hooks/store/user";
import type { TConsentParams } from "@/services/marketplace";
import { ApplicationService, OAuthService } from "@/services/marketplace";
import { AuthService } from "@/services/auth.service";
import {
  ApplicationPermissionText,
  userLevelPermissions,
  workspaceLevelPermissions,
} from "../applications/installation/details";

type TAppConsentProps = {
  application: Partial<TUserApplication>;
  consentParams: TConsentParams;
  workspaceSlug: string;
  workspaceAppInstallations: Record<string, boolean>;
  workspacePermissions: Record<string, "allowed" | "not_allowed">;
  disableDropdown: boolean;
};

const oauthService = new OAuthService();
const applicationService = new ApplicationService();
const authService = new AuthService();

export const AppConsent = observer(function AppConsent({
  application,
  consentParams,
  workspaceSlug,
  workspacePermissions = {},
  workspaceAppInstallations = {},
  disableDropdown,
}: TAppConsentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { preferredWorkspaceSlug } = useUser();
  const workspaceSlugFromParams = workspaceSlug;

  // if workspaceSlug is not available in URL, pick last visited workspace's slug from settings
  if (!workspaceSlug) {
    workspaceSlug = preferredWorkspaceSlug ?? "";
  }

  const { workspaces } = useWorkspace();
  const allWorkspacesList = Object.values(workspaces ?? {});

  // Fetch supported workspace IDs from API (API handles filtering based on supported_plans)
  const { data: supportedWorkspaceIds, isLoading: isLoadingWorkspaces } = useSWR<string[]>(
    consentParams.client_id ? `supported-workspace-ids-${consentParams.client_id}` : null,
    async () => {
      if (!consentParams.client_id) return [];
      return (await applicationService.getSupportedWorkspaceIds(consentParams.client_id)) ?? [];
    }
  );

  // Filter workspaces from store based on supported workspace IDs
  const workspacesList = useMemo(() => {
    // Wait for API to load before filtering
    if (supportedWorkspaceIds === undefined || supportedWorkspaceIds === null) {
      return [];
    }

    // Filter workspaces to only include supported ones
    const supportedIdsSet = new Set(supportedWorkspaceIds);
    return allWorkspacesList.filter((workspace) => supportedIdsSet.has(workspace.id));
  }, [allWorkspacesList, supportedWorkspaceIds]);

  const workspaceFromParams = useMemo(
    () => (workspacesList || []).find((workspace) => workspace.slug === workspaceSlug),
    [workspacesList, workspaceSlug]
  );

  const [selectedWorkspace, setSelectedWorkspace] = useState<IWorkspace | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);

  // Initialize selected workspace only once when workspaces list is available
  useEffect(() => {
    if (!selectedWorkspace && workspacesList.length > 0) {
      const initialWorkspace = workspaceFromParams ?? workspacesList[0];
      setSelectedWorkspace(initialWorkspace);
    }
  }, [workspacesList, workspaceFromParams, selectedWorkspace]);

  const hasPermissions = workspacePermissions?.[selectedWorkspace?.id?.toString() ?? ""] === "allowed";
  const isInstalled = useMemo(
    () => workspaceAppInstallations?.[selectedWorkspace?.id?.toString() ?? ""] ?? false,
    [workspaceAppInstallations, selectedWorkspace]
  );
  const handleWorkspaceChange = (workspace: IWorkspace) => {
    setSelectedWorkspace(workspace);
  };

  const handleAccept = async () => {
    try {
      setIsSubmitting(true);
      if (!selectedWorkspace || !application?.id || !csrfToken) return;

      // create the installation
      const installation = await applicationService.installApplication(selectedWorkspace.slug, application?.id);
      // post to oauth with additional params
      await oauthService.authorizeApplication(consentParams, csrfToken, { app_installation_id: installation?.id });
      return;
    } catch (error) {
      console.error(error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to authorize application",
      });
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const fetchCsrfToken = async () => {
    const data = await authService.requestCSRFToken();
    if (data?.csrf_token) {
      setCsrfToken(data.csrf_token);
    }
  };

  useEffect(() => {
    if (csrfToken === undefined) {
      fetchCsrfToken();
    }
    // redirect only if the workspace slug is available from the params
    if (isInstalled && workspaceSlugFromParams) {
      handleAccept();
    }
  }, [csrfToken, isInstalled]);

  return (
    <div className="flex flex-col gap-y-4 justify-center items-center">
      <div className="flex items-center space-x-4">
        {application?.logo_url ? (
          <img src={getFileURL(application?.logo_url ?? "") ?? ""} alt="Plane logo" className="w-10 h-10" />
        ) : (
          <div className="w-10 h-10 flex items-center justify-center rounded-md bg-accent-primary text-white capitalize">
            {application?.name?.[0] ?? "..."}
          </div>
        )}
        <img src={ConnectSvg} alt="Connect" className="w-5 h-5" />
        <PlaneLogo className="h-10 w-auto text-accent-primary" />
      </div>
      <h1>{t("workspace_settings.settings.applications.app_consent_title", { app: application?.name })}</h1>

      {!application?.published_at && !application?.is_internal && (
        <div className="shrink-0">
          <div className="relative flex justify-start items-start gap-2 p-2 px-4 md:w-[636px] rounded-lg bg-danger-subtle text-danger-primary">
            <CircleAlert className="size-4" />
            <div className="flex flex-col gap-1">
              <div className="text-13 font-semibold text-start">
                {t("workspace_settings.settings.applications.app_consent_unapproved_title")}
              </div>
              <div className="text-13 font-medium text-start">
                {t("workspace_settings.settings.applications.app_consent_unapproved_description")}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-y-4 border border-subtle rounded-lg p-4 bg-surface-2 w-full md:min-w-[636px]">
        <div className="text-13 text-tertiary font-medium">
          {t("workspace_settings.settings.applications.choose_workspace_to_connect_app_with")}
        </div>
        {isLoadingWorkspaces ? (
          <div className="text-13 text-placeholder">Loading workspaces...</div>
        ) : workspacesList.length > 0 ? (
          <CustomMenu
            maxHeight={"md"}
            className="flex flex-grow justify-center text-13 text-secondary"
            placement="bottom-start"
            customButton={
              <div className="flex flex-grow gap-1.5 justify-between items-center text-13 text-secondary w-full overflow-hidden">
                {selectedWorkspace ? (
                  <WorkspaceDetails workspace={selectedWorkspace} />
                ) : (
                  <span className="text-placeholder">Select workspace...</span>
                )}
                <ChevronDownIcon className="ml-auto h-4 w-4 text-secondary" />
              </div>
            }
            customButtonClassName="flex flex-grow border border-subtle-1 rounded-md p-2 bg-surface-1 text-secondary text-13 w-40"
            closeOnSelect
            disabled={disableDropdown}
          >
            {workspacesList.map((workspace) => (
              <CustomMenu.MenuItem
                key={workspace.id}
                onClick={() => {
                  handleWorkspaceChange(workspace);
                }}
                className={cn("flex items-center gap-2", selectedWorkspace?.id === workspace.id && "bg-layer-1")}
              >
                <WorkspaceDetails workspace={workspace} />
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>
        ) : (
          <div className="text-13 text-placeholder">No workspaces available for this application.</div>
        )}
        {hasPermissions ? (
          <>
            <div className="flex flex-col gap-y-2">
              <div className="text-13 text-secondary font-medium">
                {t("workspace_settings.settings.applications.app_consent_workspace_permissions_title", {
                  app: application?.name,
                })}
              </div>
              <div className="flex flex-col space-y-2 py-2 border-b border-subtle-1">
                {workspaceLevelPermissions.map((permission) => (
                  <ApplicationPermissionText key={permission.key} permission={permission} />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-y-2">
              <div className="text-13 text-secondary font-medium">
                {t("workspace_settings.settings.applications.user_permissions")}
              </div>
              <div className="text-13 text-tertiary">
                {t("workspace_settings.settings.applications.app_consent_user_permissions_title", {
                  app: application?.name,
                })}
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              {userLevelPermissions.map((permission) => (
                <ApplicationPermissionText key={permission.key} permission={permission} />
              ))}
            </div>

            <div className="flex flex-col gap-y-1">
              <div className="text-13 text-tertiary font-medium">
                {t("workspace_settings.settings.applications.app_consent_accept_title")}
              </div>
              <ul className="list-disc list-inside text-tertiary text-13">
                <li>{t("workspace_settings.settings.applications.app_consent_accept_1")}</li>
                <li>
                  {t("workspace_settings.settings.applications.app_consent_accept_2", { app: application?.name })}
                </li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <div className="flex-shrink-0">
              <div
                className={cn(
                  "relative flex  justify-start items-start gap-2 p-2 px-4 w-full rounded-lg bg-surface-1 text-tertiary"
                )}
              >
                <CircleAlert className="size-4" />
                <div className="text-13 font-medium text-start">
                  {t("workspace_settings.settings.applications.app_consent_no_access_description")}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex flex-row justify-end items-center gap-x-2 ml-auto">
        {hasPermissions && (
          <Button variant="primary" onClick={handleAccept} disabled={isSubmitting}>
            {isSubmitting
              ? t("workspace_settings.settings.applications.accepting")
              : t("workspace_settings.settings.applications.accept")}
          </Button>
        )}
        <Button variant="secondary" onClick={handleCancel} disabled={isSubmitting}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
});

function WorkspaceDetails(props: { workspace: IWorkspace }) {
  const { workspace } = props;
  return (
    <>
      <span
        className={`relative flex h-5 w-5 flex-shrink-0 items-center justify-center p-2 text-11 uppercase ${!workspace?.logo_url && "rounded-sm bg-accent-primary text-on-color"}`}
      >
        {workspace?.logo_url && workspace.logo_url !== "" ? (
          <img
            src={getFileURL(workspace.logo_url)}
            className="absolute left-0 top-0 h-full w-full rounded-sm object-cover"
            alt="Workspace Logo"
          />
        ) : (
          (workspace?.name?.[0] ?? "...")
        )}
      </span>
      <span className="text-tertiary truncate">{workspace?.name}</span>
    </>
  );
}
