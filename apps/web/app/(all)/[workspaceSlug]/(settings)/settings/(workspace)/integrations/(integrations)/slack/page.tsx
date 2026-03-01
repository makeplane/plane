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

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Cloud } from "lucide-react";
// plane web components
import { E_FEATURE_FLAGS } from "@plane/constants";
import { SILO_ERROR_CODES } from "@plane/etl/core";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { Loader } from "@plane/ui";
import { SlackIntegrationRoot } from "@/components/integrations/slack";
//  plane web hooks
import { useFlag, useWorkspaceSubscription } from "@/plane-web/hooks/store";
// plane web constants
import { useSlackIntegration } from "@/plane-web/hooks/store/integrations/use-slack";
import { SiloAppService } from "@/services/integrations/silo.service";
import type { Route } from "./+types/page";

const siloAppService = new SiloAppService();

function SlackIntegration({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  const searchParams = useSearchParams();
  // store hooks
  const { fetchExternalApiToken, externalApiToken } = useSlackIntegration();
  // derived values
  const isFeatureEnabled = useFlag(workspaceSlug, E_FEATURE_FLAGS.SLACK_INTEGRATION) || false;
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
    !externalApiToken ? `IMPORTER_EXTERNAL_SERVICE_TOKEN` : null,
    !externalApiToken ? async () => fetchExternalApiToken(workspaceSlug) : null,
    { errorRetryCount: 0 }
  );

  // error message
  const errorCode = searchParams.get("error");
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
      <div className="relative space-y-6">
        {/* header */}
        <div className="flex flex-col border border-subtle rounded-sm p-4 mb-2 justify-center">
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

  if (!isFeatureEnabled)
    return (
      <div className="text-secondary relative flex justify-center items-center">
        {t("integrations.not_enabled", { name: "Slack" })}
      </div>
    );

  if (supportedIntegrationsError)
    return (
      <div className="text-secondary relative flex justify-center items-center">
        {t("integrations.error_fetching_supported_integrations")}
      </div>
    );

  if (supportedIntegrations && !supportedIntegrations.includes(E_INTEGRATION_KEYS.SLACK))
    return (
      <div className={"flex h-full flex-col items-center justify-center"}>
        <Cloud size={96} />
        <div className="text-secondary text-center text-body-xs-regular relative flex justify-center items-center">
          {isSelfManaged
            ? t("integrations.not_configured_message_admin", { name: "Slack" })
            : t("integrations.not_configured_message_support", { name: "Slack" })}
        </div>
      </div>
    );

  return (
    <div className="space-y-6 relative w-full h-full overflow-auto flex flex-col">
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
}

export default observer(SlackIntegration);
