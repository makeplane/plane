"use client";

import { FC, useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane web components components
import { Cloud } from "lucide-react";
import { E_FEATURE_FLAGS, SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import { E_INTEGRATION_KEYS, SILO_ERROR_CODES } from "@plane/etl/core";
import { useTranslation } from "@plane/i18n";
import { Loader, TOAST_TYPE, setToast } from "@plane/ui";
import { GithubHeader, IntegrationRoot, UserAuthentication } from "@/plane-web/components/integrations/github";
// plane web hooks
import { useFlag, useGithubIntegration, useWorkspaceSubscription } from "@/plane-web/hooks/store";
// public images
import { SiloAppService } from "@/plane-web/services/integrations/silo.service";

const siloAppService = new SiloAppService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));

const GitHubIntegration: FC<{ searchParams?: { error: string } }> = observer(({ searchParams }) => {
  // hooks
  const {
    workspace,
    externalApiToken,
    fetchExternalApiToken,
    auth: { workspaceConnectionIds, workspaceConnectionById },
  } = useGithubIntegration();

  const { t } = useTranslation();

  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const isFeatureEnabled = useFlag(workspaceSlug?.toString() || "", E_FEATURE_FLAGS.GITHUB_INTEGRATION) || false;
  const workspaceConnectionId = workspaceConnectionIds[0] || undefined;
  const organization = workspaceConnectionId ? workspaceConnectionById(workspaceConnectionId) : undefined;
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();

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
    return (
      <div className="relative space-y-6">
        {/* header */}
        <GithubHeader />
        <div className="flex flex-col border border-custom-border-200 rounded p-4 mb-2 justify-center">
          {/* Icon and Title Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Loader>
                <Loader.Item height="44px" width="44px" />
              </Loader>
              <Loader>
                <Loader.Item height="24px" width="80px" />
              </Loader>
            </div>
            <Loader.Item height="29px" width="80px" />
          </div>
        </div>
      </div>
    );

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

  if (supportedIntegrations && !supportedIntegrations.includes(E_INTEGRATION_KEYS.GITHUB))
    return (
      <div className={"flex h-full flex-col items-center justify-center"}>
        <Cloud size={96} />
        <div className="text-custom-text-200 text-center text-md relative flex justify-center items-center">
          {isSelfManaged
            ? t("integrations.not_configured_message_admin", { name: "GitHub" })
            : t("integrations.not_configured_message_support", { name: "GitHub" })}
        </div>
      </div>
    );

  return (
    <div className="relative space-y-6">
      {/* header */}
      <GithubHeader />
      {/* integration auth root */}
      <UserAuthentication />

      {/* integration root */}
      {organization && <IntegrationRoot />}
    </div>
  );
});

export default GitHubIntegration;
