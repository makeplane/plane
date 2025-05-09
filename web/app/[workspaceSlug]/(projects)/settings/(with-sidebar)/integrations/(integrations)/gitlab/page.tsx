"use client";

import { FC, useEffect } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import useSWR from "swr";
// plane web components components
import { Cloud } from "lucide-react";
import { E_FEATURE_FLAGS, SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import { E_INTEGRATION_KEYS, SILO_ERROR_CODES } from "@plane/etl/core";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { UserAuthentication, IntegrationRoot } from "@/plane-web/components/integrations/gitlab";
// plane web hooks
import { useFlag, useGitlabIntegration, useWorkspaceSubscription } from "@/plane-web/hooks/store";
// public images
import { SiloAppService } from "@/plane-web/services/integrations/silo.service";
import GitlabLogo from "@/public/services/gitlab.svg";

const siloAppService = new SiloAppService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));

const GitlabIntegration: FC<{ searchParams?: { error: string } }> = observer(({ searchParams }) => {
  // hooks
  const {
    workspace,
    externalApiToken,
    fetchExternalApiToken,
    auth: { workspaceConnectionIds, workspaceConnectionById },
  } = useGitlabIntegration();

  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const isFeatureEnabled = useFlag(workspaceSlug?.toString() || "", E_FEATURE_FLAGS.GITLAB_INTEGRATION) || false;
  const workspaceConnectionId = workspaceConnectionIds[0] || undefined;
  const organization = workspaceConnectionId ? workspaceConnectionById(workspaceConnectionId) : undefined;
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();

  const { t } = useTranslation();

  // derived values
  const isSelfManaged = subscriptionDetail?.is_self_managed;

  // Fetch Supported Integrations
  const {
    data: supportedIntegrations,
    isLoading: supportedIntegrationsLoading,
    error: supportedIntegrationsError,
  } = useSWR(`SILO_SUPPORTED_INTEGRATIONS`, () => siloAppService.getSupportedIntegrations(), {
    revalidateOnFocus: false,
  });

  // fetching external api token
  const { isLoading: externalApiTokenIsLoading } = useSWR(
    isFeatureEnabled && workspaceSlug && !externalApiToken ? `IMPORTER_EXTERNAL_SERVICE_TOKEN_${workspaceSlug}` : null,
    isFeatureEnabled && workspaceSlug && !externalApiToken ? async () => fetchExternalApiToken(workspaceSlug) : null,
    { errorRetryCount: 0 }
  );

  // error message
  const errorCode = searchParams?.error;
  useEffect(() => {
    if (!errorCode) {
      return;
    }

    const message = SILO_ERROR_CODES.find((code) => String(code.code) === errorCode)?.description;
    if (message) {
      setToast({
        title: "Error",
        message: t(`silo_errors.${message}`),
        type: TOAST_TYPE.ERROR,
      });
    }
  }, [errorCode]);

  if (!isFeatureEnabled) return null;

  if ((!externalApiToken && externalApiTokenIsLoading) || (!supportedIntegrations && supportedIntegrationsLoading))
    return <div className="text-custom-text-200 relative flex justify-center items-center">Loading...</div>;

  if (!externalApiToken)
    return (
      <div className="text-custom-text-200 relative flex justify-center items-center">
        {t("integrations.external_api_unreachable")}
      </div>
    );

  if (supportedIntegrationsError)
    return (
      <div className="text-custom-text-200 relative flex justify-center items-center">
        {t("integrations.error_fetching_supported_integrations")}
      </div>
    );

  if (supportedIntegrations && !supportedIntegrations.includes(E_INTEGRATION_KEYS.GITLAB))
    return (
      <div className={"flex h-full flex-col items-center justify-center"}>
        <Cloud size={96} />
        <div className="text-custom-text-200 text-center text-sm relative flex justify-center items-center">
          {isSelfManaged
            ? t("integrations.not_configured_message_admin", { name: "Gitlab" })
            : t("integrations.not_configured_message_support", { name: "Gitlab" })}
        </div>
      </div>
    );

  return (
    <div className="relative space-y-10">
      {/* header */}
      <div className="flex-shrink-0 relative flex items-center gap-4 rounded bg-custom-background-90/50 p-4">
        <div className="flex-shrink-0 w-10 h-10 relative flex justify-center items-center overflow-hidden">
          <Image src={GitlabLogo} layout="fill" objectFit="contain" alt="Gitlab Logo" />
        </div>
        <div>
          <div className="text-lg font-medium">{t("gitlab_integration.name")}</div>
          <div className="text-sm text-custom-text-200">{t("gitlab_integration.description")}</div>
        </div>
      </div>

      {/* integration auth root */}
      <UserAuthentication />

      {/* integration root */}
      {organization && <IntegrationRoot />}
    </div>
  );
});

export default GitlabIntegration;
