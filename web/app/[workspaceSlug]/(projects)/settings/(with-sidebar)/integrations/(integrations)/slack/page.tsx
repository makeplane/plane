"use client";

import { FC, useEffect } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { ArrowLeft, Cloud } from "lucide-react";
// plane web components
import { E_FEATURE_FLAGS, SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import { E_INTEGRATION_KEYS, SILO_ERROR_CODES } from "@plane/etl/core";
import { useTranslation } from "@plane/i18n";
import { Loader, setToast, TOAST_TYPE } from "@plane/ui";
import { SlackIntegrationRoot } from "@/plane-web/components/integrations/slack";
//  plane web hooks
import { useFlag, useWorkspaceSubscription } from "@/plane-web/hooks/store";
// plane web constants
import { useSlackIntegration } from "@/plane-web/hooks/store/integrations/use-slack";
import { SiloAppService } from "@/plane-web/services/integrations/silo.service";

const siloAppService = new SiloAppService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));

const SlackIntegration: FC<{ searchParams?: { error: string } }> = observer(({ searchParams }) => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { fetchExternalApiToken, externalApiToken } = useSlackIntegration();
  // derived values
  const isFeatureEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.SLACK_INTEGRATION) || false;
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
  const { t } = useTranslation();

  // fetching external api token
  const { isLoading: externalApiTokenIsLoading } = useSWR(
    workspaceSlug && !externalApiToken ? `IMPORTER_EXTERNAL_SERVICE_TOKEN` : null,
    workspaceSlug && !externalApiToken ? async () => fetchExternalApiToken(workspaceSlug?.toString()) : null,
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

  if ((!externalApiToken && externalApiTokenIsLoading) || (!supportedIntegrations && supportedIntegrationsLoading))
    return (
      <div className="text-custom-text-200 relative flex justify-center items-center">{t("integrations.loading")}</div>
    );

  if (!isFeatureEnabled)
    return (
      <div className="text-custom-text-200 relative flex justify-center items-center">
        {t("integrations.not_enabled", { name: "Slack" })}
      </div>
    );

  if (supportedIntegrationsError)
    return (
      <div className="text-custom-text-200 relative flex justify-center items-center">
        {t("integrations.error_fetching_supported_integrations")}
      </div>
    );

  if (supportedIntegrations && !supportedIntegrations.includes(E_INTEGRATION_KEYS.SLACK))
    return (
      <div className={"flex h-full flex-col items-center justify-center"}>
        <Cloud size={96} />
        <div className="text-custom-text-200 text-center text-sm relative flex justify-center items-center">
          {isSelfManaged
            ? t("integrations.not_configured_message_admin", { name: "Slack" })
            : t("integrations.not_configured_message_support", { name: "Slack" })}
        </div>
      </div>
    );

  return (
    <div className="space-y-6 relative w-full h-full overflow-auto flex flex-col">
      <div className="flex-shrink-0 text-sm text-custom-text-300 hover:text-custom-text-200 hover:underline font-medium">
        <Link className="flex items-center gap-2" href={`/${workspaceSlug?.toString()}/settings/integrations`}>
          <ArrowLeft size={16} />
          {t("integrations.back_to_integrations")}
        </Link>
      </div>
      {externalApiTokenIsLoading ? (
        <Loader className="w-full h-full flex flex-col gap-8">
          <Loader.Item width="100%" height="60px" />
          <Loader.Item width="100%" height="40px" />
          <Loader.Item width="200px" height="30px" />
          <Loader.Item width="100%" height="45px" />
          <Loader.Item width="100%" height="45px" />
        </Loader>
      ) : (
        <SlackIntegrationRoot />
      )}
    </div>
  );
});

export default SlackIntegration;
