"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, CircleAlert } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { PlaneLogo } from "@plane/propel/icons";
import { IWorkspace, TUserApplication } from "@plane/types";
import { Button, cn, CustomMenu, setToast, TOAST_TYPE } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { ApplicationService, OAuthService, TConsentParams } from "@/plane-web/services/marketplace";
import ConnectSvg from "@/public/marketplace/connect.svg";
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
  worskapcePermissions: Record<string, "allowed" | "not_allowed">;
};

const oauthService = new OAuthService();
const applicationService = new ApplicationService();
const authService = new AuthService();

export const AppConsent = observer(
  ({ application, consentParams, workspaceSlug, worskapcePermissions = {} }: TAppConsentProps) => {
    const { t } = useTranslation();
    const router = useRouter();

    const { workspaces } = useWorkspace();
    const workspacesList = Object.values(workspaces ?? {});
    const workspaceFromParams = workspacesList.find((workspace) => workspace.slug === workspaceSlug);

    const [selectedWorkspace, setSelectedWorkspace] = useState<IWorkspace>(workspaceFromParams ?? workspacesList[0]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);

    const hasPermissions = worskapcePermissions?.[selectedWorkspace?.id?.toString() ?? ""] === "allowed";
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
    }, [csrfToken]);

    return (
      <div className="flex flex-col gap-y-4 justify-center items-center">
        <div className="flex items-center space-x-4">
          {application?.logo_url ? (
            <Image src={getFileURL(application?.logo_url ?? "") ?? ""} alt="Plane logo" className="w-10 h-10" />
          ) : (
            <div className="w-10 h-10 flex items-center justify-center rounded-md bg-custom-primary-500 text-white capitalize">
              {application?.name?.[0] ?? "..."}
            </div>
          )}
          <Image src={ConnectSvg} alt="Connect" className="w-5 h-5" />
          <PlaneLogo className="h-10 w-auto text-custom-primary-100" />
        </div>
        <h1>{t("workspace_settings.settings.applications.app_consent_title", { app: application?.name })}</h1>

        {!application?.published_at && !application?.is_internal && (
          <div className="flex-shrink-0">
            <div
              className={cn(
                "relative flex  justify-start items-start gap-2 p-2 px-4 md:w-[636px] rounded-lg bg-red-300/10 text-red-500"
              )}
            >
              <CircleAlert className="size-4" />
              <div className="flex flex-col gap-1">
                <div className="text-sm font-semibold text-start">
                  {t("workspace_settings.settings.applications.app_consent_unapproved_title")}
                </div>
                <div className="text-sm font-medium text-start">
                  {t("workspace_settings.settings.applications.app_consent_unapproved_description")}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-y-4 border border-custom-border-100 rounded-lg p-4 bg-custom-background-90 w-full md:min-w-[636px]">
          <div className="text-sm text-custom-text-300 font-medium">
            {t("workspace_settings.settings.applications.choose_workspace_to_connect_app_with")}
          </div>
          <CustomMenu
            maxHeight={"md"}
            className="flex flex-grow justify-center text-sm text-custom-text-200"
            placement="bottom-start"
            customButton={
              <div className="flex flex-grow gap-1.5 justify-between items-center text-sm text-custom-text-200 w-full overflow-hidden">
                <WorkspaceDetails workspace={selectedWorkspace} />
                <ChevronDown className="ml-auto h-4 w-4 text-custom-text-200" />
              </div>
            }
            customButtonClassName="flex flex-grow border border-custom-border-200 rounded-md p-2 bg-custom-background-100 text-custom-text-200 text-sm w-40"
            closeOnSelect
          >
            {workspacesList.map((workspace, index) => (
              <CustomMenu.MenuItem
                key={workspace.id}
                onClick={() => {
                  handleWorkspaceChange(workspace);
                }}
                className="flex items-center gap-2"
              >
                <WorkspaceDetails workspace={workspace} />
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>
          {hasPermissions ? (
            <>
              <div className="flex flex-col gap-y-2">
                <div className="text-sm text-custom-text-200 font-medium">
                  {t("workspace_settings.settings.applications.app_consent_workspace_permissions_title", {
                    app: application?.name,
                  })}
                </div>
                <div className="flex flex-col space-y-2 py-2 border-b border-custom-border-200">
                  {workspaceLevelPermissions.map((permission) => (
                    <ApplicationPermissionText key={permission.key} permission={permission} />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-y-2">
                <div className="text-sm text-custom-text-200 font-medium">
                  {t("workspace_settings.settings.applications.user_permissions")}
                </div>
                <div className="text-sm text-custom-text-300">
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
                <div className="text-sm text-custom-text-300 font-medium">
                  {t("workspace_settings.settings.applications.app_consent_accept_title")}
                </div>
                <ul className="list-disc list-inside text-custom-text-300 text-sm">
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
                    "relative flex  justify-start items-start gap-2 p-2 px-4 w-full rounded-lg bg-custom-background-100 text-custom-text-300"
                  )}
                >
                  <CircleAlert className="size-4" />
                  <div className="text-sm font-medium text-start">
                    {t("workspace_settings.settings.applications.app_consent_no_access_description")}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-row justify-end items-center gap-x-2 ml-auto">
          {hasPermissions && (
            <Button variant="primary" size="sm" onClick={handleAccept} disabled={isSubmitting}>
              {isSubmitting
                ? t("workspace_settings.settings.applications.accepting")
                : t("workspace_settings.settings.applications.accept")}
            </Button>
          )}
          <Button variant="neutral-primary" size="sm" onClick={handleCancel} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    );
  }
);

const WorkspaceDetails = (props: { workspace: IWorkspace }) => {
  const { workspace } = props;
  return (
    <>
      <span
        className={`relative flex h-5 w-5 flex-shrink-0 items-center justify-center p-2 text-xs uppercase ${!workspace?.logo_url && "rounded bg-custom-primary-500 text-white"}`}
      >
        {workspace?.logo_url && workspace.logo_url !== "" ? (
          <img
            src={getFileURL(workspace.logo_url)}
            className="absolute left-0 top-0 h-full w-full rounded object-cover"
            alt="Workspace Logo"
          />
        ) : (
          (workspace?.name?.[0] ?? "...")
        )}
      </span>
      <span className="text-custom-text-300 truncate">{workspace?.name}</span>
    </>
  );
};
